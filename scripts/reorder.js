import { promises as fs } from "fs";
import path from "path";
import { load as loadYaml, dump as dumpYaml } from "js-yaml";

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".svg", ".webp"]);

async function readOrder(file) {
  try {
    const raw = await fs.readFile(file, "utf8");
    return loadYaml(raw) || [];
  } catch {
    return [];
  }
}

function interactiveReorder(initialItems, meta) {
  return new Promise((resolve) => {
    const items = [...initialItems];
    let cursor = 0;
    let grabbed = false;

    function render() {
      console.clear();
      console.log(`Reordering: ${meta.folder}`);
      if (meta.newFiles.length) console.log(`  + ${meta.newFiles.length} new file(s) appended at the bottom: ${meta.newFiles.join(", ")}`);
      if (meta.removedCount) console.log(`  - ${meta.removedCount} missing file(s) dropped from the order`);
      console.log("");
      console.log("up/down: move cursor   space: grab/drop to move item   s: save   q: quit without saving\n");
      items.forEach((item, i) => {
        const isCursor = i === cursor;
        const label = `${String(i + 1).padStart(3, " ")}. ${item}`;
        if (grabbed && isCursor) {
          console.log(`◆ \x1b[7m${label}\x1b[0m`);
        } else {
          console.log(`${isCursor ? "❯" : " "} ${label}`);
        }
      });
    }

    function cleanup() {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
    }

    function onData(key) {
      if (key === "" || key === "q") {
        cleanup();
        resolve(null);
        return;
      }
      if (key === "s") {
        cleanup();
        resolve(items);
        return;
      }
      if (key === " ") {
        grabbed = !grabbed;
        render();
        return;
      }
      if (key === "[A") {
        if (grabbed && cursor > 0) {
          [items[cursor - 1], items[cursor]] = [items[cursor], items[cursor - 1]];
          cursor -= 1;
        } else if (!grabbed && cursor > 0) {
          cursor -= 1;
        }
        render();
        return;
      }
      if (key === "[B") {
        if (grabbed && cursor < items.length - 1) {
          [items[cursor + 1], items[cursor]] = [items[cursor], items[cursor + 1]];
          cursor += 1;
        } else if (!grabbed && cursor < items.length - 1) {
          cursor += 1;
        }
        render();
        return;
      }
    }

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", onData);
    render();
  });
}

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: npm run reorder -- <folder>  (e.g. photos/portfolio/weddings)");
    process.exit(1);
  }

  const dir = path.resolve(process.cwd(), target);
  const orderPath = path.join(dir, "order.yml");

  const existingOrder = await readOrder(orderPath);
  const filesOnDisk = (await fs.readdir(dir)).filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()));

  const known = existingOrder.filter((f) => filesOnDisk.includes(f));
  const removedCount = existingOrder.length - known.length;
  const newFiles = filesOnDisk.filter((f) => !known.includes(f)).sort();
  const items = [...known, ...newFiles];

  if (items.length === 0) {
    console.log("No photos found in this folder.");
    return;
  }

  if (!process.stdin.isTTY) {
    console.error("This tool needs an interactive terminal (run it directly in your terminal, not piped).");
    process.exit(1);
  }

  const result = await interactiveReorder(items, { newFiles, removedCount, folder: target });
  if (result) {
    await fs.writeFile(orderPath, dumpYaml(result));
    console.log(`Saved ${result.length} photos to ${path.relative(process.cwd(), orderPath)}`);
  } else {
    console.log("Exited without saving.");
  }
}

main();
