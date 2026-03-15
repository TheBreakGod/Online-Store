document.getElementById('registerForm').addEventListener('submit', async (event) => { 
    event.preventDefault();

    // รับค่าจากฟอร์ม
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // ตรวจสอบความยาวของรหัสผ่าน
    if (password.length < 4 || password.length > 8) {
        Swal.fire({
            title: 'Error!',
            text: 'รหัสผ่านต้องมีความยาวระหว่าง 4 ถึง 8 ตัวอักษร!',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#007BFF',
        });
        return;
    }

    // ตรวจสอบรหัสผ่านที่ยืนยัน
    if (password !== confirmPassword) {
        Swal.fire({
            title: 'Error!',
            text: 'รหัสผ่านไม่ตรงกัน กรุณาลองอีกครั้ง!',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#007BFF',
        });
        return;
    }

    // ส่งข้อมูลไปที่ API
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const result = await response.json();

        if (result.success) {
            // หากสมัครสมาชิกสำเร็จ
            Swal.fire({
                title: 'Success!',
                text: 'สมัครสมาชิกสำเร็จ! กำลังเปลี่ยนหน้า...',
                icon: 'success',
                confirmButtonText: 'OK',
                confirmButtonColor: '#007BFF',
            }).then(() => {
                window.location.href = '/login.html'; // เปลี่ยนหน้าไปยังหน้าล็อกอิน
            });
        } else {
            // หากมีข้อผิดพลาดที่มาจากเซิร์ฟเวอร์
            Swal.fire({
                title: 'Error!',
                text: result.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก!',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#007BFF',
            });
        }
    } catch (error) {
        console.error('Error during registration:', error);
        Swal.fire({
            title: 'Error!',
            text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง!',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#007BFF',
        });
    }
});
