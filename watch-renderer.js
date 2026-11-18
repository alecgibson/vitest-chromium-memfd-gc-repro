import {readdirSync, readFileSync} from 'node:fs';

function rendererMappings() {
  const rows = [];
  for (const pid of readdirSync('/proc').filter((name) => /^\d+$/.test(name))) {
    try {
      const cmdline = readFileSync(`/proc/${pid}/cmdline`, 'utf8');
      if (!cmdline.includes('--type=renderer')) continue;
      let count = 0;
      let bytes = 0n;
      for (const line of readFileSync(`/proc/${pid}/maps`, 'utf8').split('\n')) {
        if (!line.includes('shared-memory-region')) continue;
        const [lo, hi] = line.split(' ', 1)[0].split('-').map((hex) => BigInt(`0x${hex}`));
        count++;
        bytes += hi - lo;
      }
      rows.push(`renderer ${pid}: ${count} shared-memory-region mappings, ${bytes >> 20n} MiB`);
    } catch {}
  }
  return rows;
}

setInterval(() => {
  const rows = rendererMappings();
  if (rows.length) console.log(new Date().toISOString().slice(11, 19), rows.join(' | '));
}, 1000);
