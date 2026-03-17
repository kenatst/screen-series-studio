export interface ParsedSseEvent {
  event: string;
  data: string;
}

function parseSseBlock(block: string): ParsedSseEvent | null {
  const lines = block.split("\n");
  let eventType = "";
  const dataLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
    if (!line || line.startsWith(":")) continue;
    if (line.startsWith("event:")) {
      eventType = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (!eventType || dataLines.length === 0) {
    return null;
  }

  return {
    event: eventType,
    data: dataLines.join("\n"),
  };
}

export function parseSseChunk(buffer: string, chunk: string): { events: ParsedSseEvent[]; buffer: string } {
  const normalized = `${buffer}${chunk}`.replace(/\r\n/g, "\n");
  const blocks = normalized.split("\n\n");
  const nextBuffer = blocks.pop() ?? "";
  const events = blocks
    .map(parseSseBlock)
    .filter((event): event is ParsedSseEvent => Boolean(event));

  return { events, buffer: nextBuffer };
}

export function flushSseBuffer(buffer: string): ParsedSseEvent[] {
  const trailing = buffer.replace(/\r\n/g, "\n").trim();
  if (!trailing) return [];
  const event = parseSseBlock(trailing);
  return event ? [event] : [];
}
