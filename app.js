// ═══════════════════════════════════════════════
// StoreByte — app.js
// ═══════════════════════════════════════════════

const DEFAULT_ENTRIES = [
  { id:1,  name:'df -h',          desc:'Show disk space usage in human-readable format for all mounted filesystems.', cmd:'df -h',                                         cat:'disk',       plat:'linux'   },
  { id:2,  name:'lsblk',          desc:'List all block devices (disks, partitions, LVM volumes) in a tree view.',     cmd:'lsblk -o NAME,SIZE,TYPE,MOUNTPOINT',            cat:'disk',       plat:'linux'   },
  { id:3,  name:'fdisk',          desc:'Partition table manipulator for MBR disks. Create, delete, and list partitions.', cmd:'fdisk -l /dev/sda',                         cat:'disk',       plat:'linux'   },
  { id:4,  name:'parted',         desc:'Partition editor supporting both MBR and GPT disk labels.',                   cmd:'parted /dev/sda print',                         cat:'disk',       plat:'linux'   },
  { id:5,  name:'du -sh',         desc:'Summarise disk usage of a directory in human-readable format.',               cmd:'du -sh /var/log/*',                             cat:'disk',       plat:'linux'   },
  { id:6,  name:'pvcreate',       desc:'Initialise a physical volume (PV) for use with LVM.',                         cmd:'pvcreate /dev/sdb',                             cat:'lvm',        plat:'linux'   },
  { id:7,  name:'vgcreate',       desc:'Create a new volume group from one or more physical volumes.',                 cmd:'vgcreate vg_data /dev/sdb /dev/sdc',            cat:'lvm',        plat:'linux'   },
  { id:8,  name:'lvcreate',       desc:'Create a logical volume within a volume group with a fixed size.',             cmd:'lvcreate -L 50G -n lv_data vg_data',            cat:'lvm',        plat:'linux'   },
  { id:9,  name:'lvextend',       desc:'Extend the size of an existing logical volume online.',                        cmd:'lvextend -L +20G /dev/vg_data/lv_data',         cat:'lvm',        plat:'linux'   },
  { id:10, name:'pvdisplay',      desc:'Display detailed information about all physical volumes.',                     cmd:'pvdisplay',                                     cat:'lvm',        plat:'linux'   },
  { id:11, name:'mkfs.ext4',      desc:'Format a partition or logical volume with the ext4 filesystem.',               cmd:'mkfs.ext4 /dev/vg_data/lv_data',                cat:'filesystem', plat:'linux'   },
  { id:12, name:'resize2fs',      desc:'Resize an ext2/3/4 filesystem to use all available space after lvextend.',    cmd:'resize2fs /dev/vg_data/lv_data',                cat:'filesystem', plat:'linux'   },
  { id:13, name:'mount',          desc:'Mount a filesystem to a directory. Use -t for type, -o for options.',          cmd:'mount -t ext4 /dev/sdb1 /mnt/data',             cat:'filesystem', plat:'linux'   },
  { id:14, name:'xfs_growfs',     desc:'Grow an XFS filesystem to fill new space (must be mounted).',                  cmd:'xfs_growfs /mnt/data',                          cat:'filesystem', plat:'linux'   },
  { id:15, name:'mdadm --create', desc:'Create a new software RAID array. Specify level and member devices.',          cmd:'mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/sdb /dev/sdc', cat:'raid', plat:'linux' },
  { id:16, name:'mdadm --detail', desc:'Show detailed status and health of a RAID array.',                             cmd:'mdadm --detail /dev/md0',                       cat:'raid',       plat:'linux'   },
  { id:17, name:'aws s3 sync',    desc:'Sync a local directory to an S3 bucket. Copies only new or changed files.',   cmd:'aws s3 sync /local/path s3://my-bucket/prefix/', cat:'cloud',      plat:'cloud'   },
  { id:18, name:'aws ec2 create-volume', desc:'Create a new EBS volume in the specified availability zone.',          cmd:'aws ec2 create-volume --size 100 --region us-east-1 --availability-zone us-east-1a --volume-type gp3', cat:'cloud', plat:'cloud' },
  { id:19, name:'gsutil rsync',   desc:'Sync local directory to a Google Cloud Storage bucket.',                       cmd:'gsutil -m rsync -r /local/path gs://my-bucket/', cat:'cloud',      plat:'cloud'   },
  { id:20, name:'showmount',      desc:'Show NFS export list from an NFS server.',                                     cmd:'showmount -e nfs-server.example.com',            cat:'nfs',        plat:'linux'   },
  { id:21, name:'exportfs',       desc:'Export NFS shares defined in /etc/exports to NFS clients.',                   cmd:'exportfs -arv',                                 cat:'nfs',        plat:'linux'   },
  { id:22, name:'iostat',         desc:'Report CPU and I/O statistics for block devices. Useful for diagnosing disk bottlenecks.', cmd:'iostat -x 2 5',                    cat:'monitoring', plat:'linux'   },
  { id:23, name:'smartctl',       desc:'Control and monitor SMART data for hard drives. Check disk health.',           cmd:'smartctl -a /dev/sda',                          cat:'monitoring', plat:'linux'   },
  { id:24, name:'iotop',          desc:'Live I/O monitoring — shows which processes are reading/writing most.',        cmd:'iotop -o',                                      cat:'monitoring', plat:'linux'   },
];

const LS_KEY = 'storebyte_entries_v1';

let entries = [];
let activeTab = 'all';
let searchVal = '';

// ── Init ──────────────────────────────────────
function init() {
  const saved = localStorage.getItem(LS_KEY);
  entries = saved ? JSON.parse(saved) : [...DEFAULT_ENTRIES];
  updateStats();
  render();
  bindShortcut();
}

function persist() {
  localStorage.setItem(LS_KEY, JSON.stringify(entries));
}

function updateStats() {
  const n = entries.length;
  document.getElementById('stat-count').textContent = n;
  const ac = document.getElementById('a-count');
  if (ac) ac.textContent = n;
}

// ── Filter & Render ───────────────────────────
function setTab(btn) {
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeTab = btn.dataset.cat;
  render();
}

function syncSearch(val) {
  searchVal = val.toLowerCase();
  const heroInput = document.getElementById('hero-search');
  const mainInput = document.getElementById('main-search');
  if (heroInput && heroInput !== document.activeElement) heroInput.value = val;
  if (mainInput && mainInput !== document.activeElement) mainInput.value = val;
  render();
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function badgeClass(plat) {
  return { linux:'badge-linux', windows:'badge-windows', cloud:'badge-cloud', both:'badge-both' }[plat] || 'badge-both';
}

function render() {
  const grid = document.getElementById('cmd-grid');
  if (!grid) return;

  let list = entries.filter(e => {
    const catOk = activeTab === 'all' || e.cat === activeTab;
    const q = searchVal;
    const txtOk = !q || e.name.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q) || (e.cmd||'').toLowerCase().includes(q);
    return catOk && txtOk;
  });

  const countEl = document.getElementById('results-count');
  if (countEl) countEl.textContent = `${list.length} entr${list.length === 1 ? 'y' : 'ies'}`;

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state">No entries found for "<strong>${esc(searchVal)}</strong>".<br/>Try a different keyword or <a href="#" onclick="openAddModal();return false;" style="color:var(--green)">add a new entry</a>.</div>`;
    return;
  }

  grid.innerHTML = list.map(e => `
    <div class="cmd-card">
      <div class="cmd-top">
        <div class="cmd-name">${esc(e.name)}</div>
        <span class="badge ${badgeClass(e.plat)}">${esc(e.plat)}</span>
      </div>
      <div class="cmd-desc">${esc(e.desc)}</div>
      ${e.cmd ? `<div class="cmd-example">${esc(e.cmd)}</div>` : ''}
      <div class="cmd-footer">
        <span class="cmd-tag">#${esc(e.cat)}</span>
        ${e.cmd ? `<button class="copy-btn" id="cb-${e.id}" onclick="copyCmd(${e.id})">copy</button>` : ''}
      </div>
    </div>
  `).join('');
}

// ── Copy ──────────────────────────────────────
function copyCmd(id) {
  const e = entries.find(x => x.id === id);
  if (!e || !e.cmd) return;
  navigator.clipboard.writeText(e.cmd).then(() => {
    const btn = document.getElementById('cb-' + id);
    if (!btn) return;
    btn.textContent = 'copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('copied'); }, 1600);
  });
}

// ── Modal ─────────────────────────────────────
function openAddModal() {
  document.getElementById('modal-bg').classList.add('open');
  document.getElementById('m-name').focus();
}

function closeAddModal() {
  document.getElementById('modal-bg').classList.remove('open');
}

function maybeClose(e) {
  if (e.target === document.getElementById('modal-bg')) closeAddModal();
}

function saveEntry() {
  const name = document.getElementById('m-name').value.trim();
  const desc = document.getElementById('m-desc').value.trim();
  const cmd  = document.getElementById('m-cmd').value.trim();
  const cat  = document.getElementById('m-cat').value;
  const plat = document.getElementById('m-plat').value;

  if (!name) { document.getElementById('m-name').focus(); return; }
  if (!desc) { document.getElementById('m-desc').focus(); return; }

  const newEntry = { id: Date.now(), name, desc, cmd, cat, plat };
  entries.unshift(newEntry);
  persist();
  updateStats();
  closeAddModal();

  // reset form
  ['m-name','m-desc','m-cmd'].forEach(id => { document.getElementById(id).value = ''; });

  // switch to show the new category
  const tabBtn = document.querySelector(`.tab[data-cat="${cat}"]`);
  if (tabBtn) setTab(tabBtn);
  else {
    const allBtn = document.querySelector('.tab[data-cat="all"]');
    if (allBtn) setTab(allBtn);
  }
}

// ── Mobile nav ────────────────────────────────
function toggleMenu() {
  const nav = document.querySelector('.nav-links');
  nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
  nav.style.flexDirection = 'column';
  nav.style.position = 'absolute';
  nav.style.top = '60px';
  nav.style.right = '1.5rem';
  nav.style.background = 'var(--bg2)';
  nav.style.border = '1px solid var(--border)';
  nav.style.borderRadius = '10px';
  nav.style.padding = '0.75rem';
  nav.style.zIndex = '100';
}

// ── Keyboard shortcut ─────────────────────────
function bindShortcut() {
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('hero-search').focus();
      document.getElementById('hero-search').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (e.key === 'Escape') closeAddModal();
  });
}

// ── Boot ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
