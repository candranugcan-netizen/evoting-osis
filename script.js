const scriptURL = 'https://script.google.com/macros/s/AKfycbwHGch7qBohxbyfuayIzxWpLl3jMT0NaId2QZrnbwZRhQ671wUhV5jYI8v0Jlm4UVDI/exec';

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
    const originalBtnText = btn.innerText;

    if (!nis) {
        Swal.fire({ icon: 'warning', title: 'Oops...', text: 'Mohon masukkan NIS Anda!', confirmButtonColor: '#4e54c8' });
        return;
    }

    // CEK KODE SEKOLAH UNTUK DASHBOARD EIS
    if (nis === '20402027') {
        loadEIS();
        return;
    }

    btn.disabled = true;
    btn.innerHTML = 'Sedang Memverifikasi...';

    fetch(`${scriptURL}?action=login&nis=${nis}`, { method: 'POST' })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            Toast.fire({ icon: 'success', title: `Selamat datang, ${data.nama}!` });
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('votePage').classList.remove('hidden');
            document.getElementById('dispNama').innerText = data.nama;
            document.getElementById('dispKelas').innerText = data.kelas;
            document.getElementById('hiddenNis').value = data.nis;
            document.getElementById('hiddenNama').value = data.nama;
            document.getElementById('hiddenKelas').value = data.kelas;
        } else {
            Swal.fire({ icon: 'error', title: 'Verifikasi Gagal', text: data.message, confirmButtonColor: '#d33' });
        }
    })
    .catch(err => {
        Swal.fire({ icon: 'error', title: 'Koneksi Terputus', text: 'Cek koneksi internet Anda.' });
    })
    .finally(() => {
        btn.disabled = false;
        btn.innerText = originalBtnText;
    });
}

// FUNGSI KHUSUS DASHBOARD EIS
function loadEIS() {
    Swal.fire({ title: 'Membuka Dashboard...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    fetch(`${scriptURL}?action=getResults`)
    .then(res => res.json())
    .then(data => {
        Swal.close();
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('eisDashboard').classList.remove('hidden');
        document.getElementById('mainBox').style.maxWidth = "700px"; // Perlebar box untuk dashboard

        const labels = data.results.map(r => r.name);
        const votes = data.results.map(r => r.votes);
        const total = votes.reduce((a, b) => a + b, 0);

        // Render Tabel
        const tableBody = document.getElementById('eisTableBody');
        tableBody.innerHTML = data.results.map(r => `
            <tr>
                <td>${r.name}</td>
                <td><strong>${r.votes}</strong></td>
                <td>${total > 0 ? ((r.votes/total)*100).toFixed(1) : 0}%</td>
            </tr>
        `).join('');

        // Render Chart
        const ctx = document.getElementById('voteChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Jumlah Suara',
                    data: votes,
                    backgroundColor: ['#4e54c8', '#8f94fb', '#4ade80', '#f87171'],
                    borderRadius: 8
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    })
    .catch(() => Swal.fire('Gagal', 'Pastikan Apps Script Anda mendukung action getResults', 'error'));
}

// LOGIKA VOTE (Tetap Sama)
document.getElementById('formVote').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.getElementById('btnVote');
    const form = this;

    Swal.fire({
        title: 'Yakin dengan pilihan Anda?',
        text: "Suara tidak dapat diubah setelah dikirim!",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#f86d1dff',
        confirmButtonText: 'Ya, Kirim!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            btn.disabled = true;
            btn.innerText = 'Sedang Mengunci Suara...';
            const params = new URLSearchParams(new FormData(form));
            params.append('action', 'vote');

            fetch(scriptURL, { method: 'POST', body: params })
            .then(() => {
                Swal.fire({ title: 'Berhasil!', text: 'Suara Anda telah disimpan.', icon: 'success' }).then(() => location.reload());
            });
        }
    });
});
