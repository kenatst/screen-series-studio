import { describe, expect, it } from "vitest";
import { flushSseBuffer, parseSseChunk } from "@/lib/sse";

describe("parseSseChunk – comprehensive", () => {
  it("parses single complete event", () => {
    const result = parseSseChunk("", "event: test\ndata: hello\n\n");
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toEqual({ event: "test", data: "hello" });
    expect(result.buffer).toBe("");
  });

  it("parses multiple events in one chunk", () => {
    const payload = "event: a\ndata: 1\n\nevent: b\ndata: 2\n\nevent: c\ndata: 3\n\n";
    const result = parseSseChunk("", payload);
    expect(result.events).toHaveLength(3);
    expect(result.events.map((e) => e.event)).toEqual(["a", "b", "c"]);
    expect(result.events.map((e) => e.data)).toEqual(["1", "2", "3"]);
  });

  it("buffers incomplete event at end of chunk", () => {
    const result = parseSseChunk("", "event: pending\ndata: waiting");
    expect(result.events).toHaveLength(0);
    expect(result.buffer).toContain("pending");
    expect(result.buffer).toContain("waiting");
  });

  it("completes buffered event with next chunk", () => {
    const first = parseSseChunk("", "event: started\ndata: part1");
    expect(first.events).toHaveLength(0);

    const second = parseSseChunk(first.buffer, "\n\nevent: done\ndata: part2\n\n");
    expect(second.events).toHaveLength(2);
    expect(second.events[0]).toEqual({ event: "started", data: "part1" });
    expect(second.events[1]).toEqual({ event: "done", data: "part2" });
  });

  it("handles CRLF line endings", () => {
    const result = parseSseChunk("", "event: test\r\ndata: value\r\n\r\n");
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toEqual({ event: "test", data: "value" });
  });

  it("handles multiline data fields", () => {
    const payload = "event: multi\ndata: line1\ndata: line2\ndata: line3\n\n";
    const result = parseSseChunk("", payload);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].data).toBe("line1\nline2\nline3");
  });

  it("ignores comment lines (starting with :)", () => {
    const payload = ": this is a comment\nevent: real\ndata: value\n\n";
    const result = parseSseChunk("", payload);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].event).toBe("real");
  });

  it("ignores blocks without event type", () => {
    const payload = "data: orphan-data\n\nevent: valid\ndata: ok\n\n";
    const result = parseSseChunk("", payload);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].event).toBe("valid");
  });

  it("ignores blocks without data", () => {
    const payload = "event: no-data\n\nevent: with-data\ndata: yes\n\n";
    const result = parseSseChunk("", payload);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].event).toBe("with-data");
  });

  it("handles JSON data fields", () => {
    const json = JSON.stringify({ slideNumber: 1, status: "ok" });
    const result = parseSseChunk("", `event: slide-done\ndata: ${json}\n\n`);
    expect(result.events).toHaveLength(1);
    const parsed = JSON.parse(result.events[0].data);
    expect(parsed.slideNumber).toBe(1);
    expect(parsed.status).toBe("ok");
  });

  it("handles generation stream events (slide-start, slide-done, all-done)", () => {
    const payload = [
      'event: slide-start\ndata: {"slideNumber":1}\n\n',
      'event: slide-done\ndata: {"slideNumber":1,"url":"path/to/img.png"}\n\n',
      'event: slide-start\ndata: {"slideNumber":2}\n\n',
      'event: slide-done\ndata: {"slideNumber":2,"url":"path/to/img2.png"}\n\n',
      'event: all-done\ndata: {"hasMore":false}\n\n',
    ].join("");

    const result = parseSseChunk("", payload);
    expect(result.events).toHaveLength(5);
    expect(result.events.map((e) => e.event)).toEqual([
      "slide-start",
      "slide-done",
      "slide-start",
      "slide-done",
      "all-done",
    ]);
  });

  it("handles slide-error event", () => {
    const payload = 'event: slide-error\ndata: {"slideNumber":3,"error":"Generation failed"}\n\n';
    const result = parseSseChunk("", payload);
    expect(result.events).toHaveLength(1);
    const parsed = JSON.parse(result.events[0].data);
    expect(parsed.error).toBe("Generation failed");
  });
});

describe("flushSseBuffer – comprehensive", () => {
  it("returns empty array for empty buffer", () => {
    expect(flushSseBuffer("")).toEqual([]);
  });

  it("returns empty array for whitespace-only buffer", () => {
    expect(flushSseBuffer("   \n\n  ")).toEqual([]);
  });

  it("flushes valid trailing event", () => {
    const result = flushSseBuffer("event: final\ndata: last-value");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ event: "final", data: "last-value" });
  });

  it("returns empty for trailing data without event", () => {
    const result = flushSseBuffer("data: orphaned");
    expect(result).toEqual([]);
  });

  it("handles CRLF in buffer", () => {
    const result = flushSseBuffer("event: end\r\ndata: done");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ event: "end", data: "done" });
  });
});
