export function parsePorcelainV1ZPaths(output) {
  const fields = output.split("\0");
  const paths = [];

  for (let index = 0; index < fields.length;) {
    const record = fields[index++];
    if (!record) continue;
    if (record.length < 4 || record[2] !== " ") {
      throw new Error(`invalid git status --porcelain=v1 -z record: ${record}`);
    }

    const status = record.slice(0, 2);
    const destination = record.slice(3);
    paths.push(destination);

    const renamed = status.includes("R");
    const copied = status.includes("C");
    if (renamed || copied) {
      const source = fields[index++];
      if (!source) {
        throw new Error(`missing source path for git status record: ${record}`);
      }
      if (renamed) paths.push(source);
    }
  }

  return [...new Set(paths)];
}
