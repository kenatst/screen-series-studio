import { describe, expect, it } from "vitest";
import { flushSseBuffer, parseSseChunk } from "@/lib/sse";

describe("SSE parser", () => {
  it("parses complete CRLF events with multiline data", () => {
    const payload = [
      "event: slide-start\r\n",
      'data: {"slideNumber":1}\r\n',
      "\r\n",
      "event: slide-done\r\n",
      'data: {"slideNumber":1,\r\n',
      'data: "status":"ok"}\r\n',
      "\r\n",
    ].join("");

    const parsed = parseSseChunk("", payload);

    expect(parsed.buffer).toBe("");
    expect(parsed.events).toHaveLength(2);
    expect(parsed.events[0]).toEqual({
      event: "slide-start",
      data: '{"slideNumber":1}',
    });
    expect(parsed.events[1]).toEqual({
      event: "slide-done",
      data: '{"slideNumber":1,\n"status":"ok"}',
    });
  });

  it("handles partial chunks and flushes trailing event", () => {
    const firstChunk = "event: slide-start\ndata: {\"slideNumber\":2}";
    const secondChunk = "\n\nevent: all-done\ndata: {\"hasMore\":false}";

    const firstParse = parseSseChunk("", firstChunk);
    expect(firstParse.events).toHaveLength(0);
    expect(firstParse.buffer).toContain("slide-start");

    const secondParse = parseSseChunk(firstParse.buffer, secondChunk);
    expect(secondParse.events).toHaveLength(1);
    expect(secondParse.events[0].event).toBe("slide-start");

    const flushed = flushSseBuffer(secondParse.buffer);
    expect(flushed).toHaveLength(1);
    expect(flushed[0]).toEqual({
      event: "all-done",
      data: '{"hasMore":false}',
    });
  });

  it("ignores comments and invalid blocks", () => {
    const parsed = parseSseChunk(
      "",
      [
        ": ping",
        "",
        "data: no-event-name",
        "",
        "event: valid",
        "data: hello",
        "",
      ].join("\n"),
    );
    const events = [...parsed.events, ...flushSseBuffer(parsed.buffer)];

    expect(events).toEqual([{ event: "valid", data: "hello" }]);
  });
});
