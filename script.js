const scriptURL = 'https://script.google.com/macros/s/AKfycbxLankbMXgZGnmaLwHtuEch999UuKNR14j3n52jFSYMIR2OTPz2YG-orHjuu0XvNtWe/exec';

let eisChart1, eisChart2;
let updateInterval;

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true
});

function prosesLogin() {
    const nis = document.getElementById('nisInput').value;
    const btn = document.getElementById('btnLogin');

    if (!nis) {
        Swal.fire({ icon: 'warning', title: 'Oops...', text: 'Mohon masukkan NIS Anda!', confirmButtonColor: '#4e54c8' });
        return;
    }

    if (nis === '20402027') {
        startEIS();
        return;
    }

    btn.disabled = true;
    btn.innerHTML = 'Memverifikasi...';

    fetch(`${scriptURL}?action=login&nis=${nis}`, { method: 'POST' })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            Toast.fire({ icon: 'success', title: `Selamat datang, ${data.nama}` });
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('votePage').classList.remove('hidden');
            document.getElementById('dispNama').innerText = data.nama;
            document.getElementById('dispKelas').innerText = data.kelas;
            document.getElementById('hiddenNis').value = data.nis;
            document.getElementById('hiddenNama').value = data.nama;
            document.getElementById('hiddenKelas').value = data.kelas;
        } else {
            Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: data.message });
        }
    })
    .catch(() => Swal.fire('Error', 'Koneksi gagal', 'error'))
    .finally(() => {
        btn.disabled = false;
        btn.innerText = 'Masuk & Memilih';
    });
}

function startEIS() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('eisDashboard').classList.remove('hidden');
    document.getElementById('mainBox').style.maxWidth = "900px";
    
    refreshDashboard();
    // Update setiap 3 detik
    updateInterval = setInterval(refreshDashboard, 3000);
}

function refreshDashboard() {
    fetch(`${scriptURL}?action=getResults`)
    .then(res => res.json())
    .then(data => {
        renderCharts(data);
        renderTable(data);
    })
    .catch(err => console.error("Update gagal:", err));
}

function renderCharts(data) {
    const labels = data.results.map(r => r.name);
    const votes = data.results.map(r => r.votes);

    // 1. Grafik Perolehan Suara (Bar)
    const ctx1 = document.getElementById('voteChart').getContext('2d');
    if (eisChart1) eisChart1.destroy();
    eisChart1 = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Suara',
                data: votes,
                backgroundColor: ['#4e54c8', '#8f94fb', '#4ade80', '#f87171'],
                borderRadius: 8
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    // 2. Grafik Partisipasi Pemilih (Doughnut)
    const ctx2 = document.getElementById('participationChart').getContext('2d');
    if (eisChart2) eisChart2.destroy();
    eisChart2 = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Sudah', 'Belum'],
            datasets: [{
                data: [data.participation.sudah, data.participation.belum],
                backgroundColor: ['#4ade80', '#e2e8f0']
            }]
        },
        options: { responsive: true, cutout: '70%', plugins: { legend: { position: 'bottom' } } }
    });
}

function renderTable(data) {
    const total = data.results.reduce((a, b) => a + b.votes, 0);
    const tableBody = document.getElementById('eisTableBody');
    tableBody.innerHTML = data.results.map(r => `
        <tr>
            <td>${r.name}</td>
            <td><strong>${r.votes}</strong></td>
            <td>${total > 0 ? ((r.votes/total)*100).toFixed(1) : 0}%</td>
        </tr>
    `).join('');
}

document.getElementById('formVote').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.getElementById('btnVote');
    const form = this;

    Swal.fire({
        title: 'Kirim Suara?',
        text: "Pilihan tidak dapat diubah!",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#4e54c8'
    }).then((result) => {
        if (result.isConfirmed) {
            btn.disabled = true;
            btn.innerText = 'Menyimpan...';
            const params = new URLSearchParams(new FormData(form));
            params.append('action', 'vote');

            fetch(scriptURL, { method: 'POST', body: params })
            .then(() => {
                Swal.fire('Berhasil!', 'Suara Anda telah masuk.', 'success').then(() => location.reload());
            })
            .catch(() => {
                Swal.fire('Gagal', 'Terjadi kesalahan.', 'error');
                btn.disabled = false;
                btn.innerText = 'Kirim Suara Sekarang';
            });
        }
    });
});
