// ฟังก์ชันเปิด Popup เมื่อเกิดการล็อกอินสำเร็จหรือผิดพลาด
document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const popupModal = document.getElementById('popupModal');
    const popupMessage = document.getElementById('popupMessage');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        // แสดงข้อความใน Popup
        if (result.success) {
            // บันทึก userId และ email ใน localStorage
            localStorage.setItem('userId', result.user_id);
            localStorage.setItem('userEmail', email);

            popupMessage.innerHTML = '<i class="fas fa-check-circle" style="color: #00ff80;"></i> เข้าสู่ระบบสำเร็จ !';
            popupModal.style.display = 'flex'; // แสดง Popup ที่ตำแหน่งกลางจอ
            setTimeout(() => {
                popupModal.style.display = 'none';
                window.location.href = 'indes01.html'; // หรือที่อยู่ที่คุณต้องการ
            }, 1500);
        } else {
            popupMessage.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #ff4040;"></i> อีเมลหรือรหัสผ่านไม่ถูกต้อง !';
            popupModal.style.display = 'flex'; // แสดง Popup ที่ตำแหน่งกลางจอ
        }
    } catch (error) {
        console.error('Error during login:', error);
        popupMessage.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: #ffcc00;"></i> เกิดข้อผิดพลาดในการเข้าสู่ระบบ !';
        popupModal.style.display = 'flex'; // แสดง Popup ที่ตำแหน่งกลางจอ
    }
});

// ฟังก์ชันปิด Popup
function closePopup() {
    document.getElementById('popupModal').style.display = 'none'; // ซ่อน Popup เมื่อคลิกปุ่ม X
}

// ปิด Popup เมื่อคลิกนอกกรอบ
window.addEventListener('click', (event) => {
    const popupModal = document.getElementById('popupModal');
    if (event.target === popupModal) {
        popupModal.style.display = 'none'; // ซ่อน Popup เมื่อคลิกนอกกรอบ
    }
});
