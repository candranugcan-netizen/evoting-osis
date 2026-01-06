// URL Google Apps Script (GANTI DENGAN URL DEPLOY TERBARU ANDA JIKA BERUBAH)
const scriptURL = 'https://script.google.com/macros/s/AKfycbz1LIkYHu1FVwTvipMleeHgRSUeJl19fGdGuiCUXYHpfQF-ycS92KQCUZLLjaKgS8CpVg/exec';

// Konfigurasi dasar untuk SweetAlert agar konsisten
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

function prosesLogin() {
    const nis = document.getElementById('nisInput').value;
    const btn = document.getElementById('btnLogin');
    const originalBtnText = btn.innerText;

    if (!nis) {
        // Alert Modern: Peringatan NIS kosong
        Swal.fire({
            icon: 'warning',
            title: 'Oops...',
            text: 'Mohon masukkan NIS Anda terlebih dahulu!',
            confirmButtonColor: '#4e54c8',
            confirmButtonText: 'Oke, siap!'
        });
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Sedang Memverifikasi...';

    fetch(`${scriptURL}?action=login&nis=${nis}`, { method: 'POST' })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            // Toast Sukses Login
            Toast.fire({
                icon: 'success',
                title: `Selamat datang, ${data.nama}!`
            });

            // Transisi UI
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('votePage').classList.remove('hidden');
            
            // Isi data UI
            document.getElementById('dispNama').innerText = data.nama;
            document.getElementById('dispKelas').innerText = data.kelas;
            
            // Isi hidden inputs
            document.getElementById('hiddenNis').value = data.nis;
            document.getElementById('hiddenNama').value = data.nama;
            document.getElementById('hiddenKelas').value = data.kelas;
        } else {
            // Alert Modern: Gagal Login (NIS salah atau sudah milih)
            Swal.fire({
                icon: 'error',
                title: 'Verifikasi Gagal',
                text: data.message,
                confirmButtonColor: '#d33',
                background: '#fff0f0'
            });
        }
    })
    .catch(err => {
        Swal.fire({
            icon: 'error',
            title: 'Koneksi Terputus',
            text: 'Gagal menghubungi server. Cek koneksi internet Anda.',
        });
    })
    .finally(() => {
        btn.disabled = false;
        btn.innerText = originalBtnText;
    });
}

document.getElementById('formVote').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.getElementById('btnVote');
    const originalBtnText = btn.innerText;
    const form = this;

    // Konfirmasi Modern sebelum mengirim
    Swal.fire({
        title: 'Yakin dengan pilihan Anda?',
        text: "Pilihan tidak dapat diubah setelah dikirim. Pastikan sudah benar!",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#4e54c8',
        cancelButtonColor: '#718096',
        confirmButtonText: 'Ya, Kirim Suara!',
        cancelButtonText: 'Batal, saya mau cek lagi',
        reverseButtons: true,
        backdrop: `
            rgba(78, 84, 200,0.2)
            left top
            no-repeat
          `
    }).then((result) => {
        if (result.isConfirmed) {
            // Jika user klik "Ya, Kirim Suara!"
            btn.disabled = true;
            btn.innerHTML = 'Sedang Mengunci Suara...';

            const formData = new FormData(form);
            const params = new URLSearchParams(formData);
            params.append('action', 'vote');

            fetch(scriptURL, { method: 'POST', body: params })
            .then(res => {
                // Alert Sukses Besar setelah memilih
                Swal.fire({
                    title: 'Terima Kasih!',
                    text: 'Suara Anda telah berhasil disimpan.',
                    icon: 'success',
                    confirmButtonColor: '#00c853',
                    confirmButtonText: 'Selesai',
                    timer: 3000,
                    willClose: () => {
                        location.reload();
                    }
                });
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Mengirim',
                    text: 'Terjadi kesalahan saat mengirim suara. Silakan coba lagi.',
                });
                btn.disabled = false;
                btn.innerText = originalBtnText;
            });
        }
    });
});