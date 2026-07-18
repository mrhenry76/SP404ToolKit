export type ParsedArgs = {
  positionals: string[];
  options: Map<string, string | true>;
};

export function parseArgs(argv: readonly string[]): ParsedArgs {
  const positionals: string[] = [];
  const options = new Map<string, string | true>();
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value?.startsWith("--")) {
      if (value !== undefined) positionals.push(value);
      continue;
    }
    const equal = value.indexOf("=");
    if (equal >= 0) {
      options.set(value.slice(2, equal), value.slice(equal + 1));
      continue;
    }
    const name = value.slice(2);
    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith("--")) {
      options.set(name, next);
      index += 1;
    } else {
      options.set(name, true);
    }
  }
  return { positionals, options };
}

export function optionString(args: ParsedArgs, name: string): string | undefined {
  const value = args.options.get(name);
  return typeof value === "string" ? value : undefined;
}

export function optionNumber(args: ParsedArgs, name: string): number | undefined {
  const value = optionString(args, name);
  if (value === undefined) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`--${name} must be numeric.`);
  return number;
}

export function optionFlag(args: ParsedArgs, name: string): boolean {
  return args.options.get(name) === true;
}
