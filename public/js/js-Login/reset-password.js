const resetForm = document.getElementById('resetForm');

resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // ตรวจสอบความยาวของรหัสผ่าน
    if (newPassword.length < 4 || newPassword.length > 8) {
        Swal.fire({
            title: 'Error!',
            text: 'รหัสผ่านต้องมีความยาวระหว่าง 4 ถึง 8 ตัวอักษร!',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#007BFF',
        });
        return;
    }

    // ตรวจสอบว่ารหัสผ่านตรงกันหรือไม่
    if (newPassword !== confirmPassword) {
        Swal.fire({
            title: 'Error!',
            text: 'รหัสผ่านไม่ตรงกัน กรุณาลองอีกครั้ง',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#007BFF',
        });
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                newPassword
            }),
        });

        const data = await response.json();

        if (response.ok) {
            Swal.fire({
                title: 'Success!',
                text: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว',
                icon: 'success',
                confirmButtonText: 'OK',
                confirmButtonColor: '#007BFF',
            }).then(() => {
                window.location.href = '/login.html'; // ไปหน้า login
            });
        } else {
            console.error('Error data:', data); // Log ข้อมูลข้อผิดพลาด
            Swal.fire({
                title: 'Error!',
                text: data.error,
                icon: 'error',
                confirmButtonText: 'ลองอีกครั้ง',
                confirmButtonColor: '#007BFF',
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error!',
            text: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#007BFF',
        });
    }
});
