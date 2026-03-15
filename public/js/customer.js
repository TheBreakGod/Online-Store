window.onload = function () {  
    const customerForm = document.getElementById('customer-form');
    
    // โหลดข้อมูลลูกค้าจาก localStorage เมื่อเพจโหลด
    loadCustomerData();

    customerForm.addEventListener('submit', function (event) {
        event.preventDefault(); // ป้องกันไม่ให้ฟอร์มส่งข้อมูลทันที

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;
        const city = document.getElementById('city').value;
        const postal = document.getElementById('postal').value;

        // ตรวจสอบความถูกต้องของข้อมูล
        if (validateForm(name, email, phone, address, city, postal)) {
            const formData = {
                name: name,
                email: email,
                phone: phone,
                address: address,
                city: city,
                postal: postal
            };

            // บันทึกข้อมูลใน localStorage ทันที
            localStorage.setItem('customerData', JSON.stringify(formData));
            alert('ข้อมูลถูกบันทึกเรียบร้อยแล้ว');
            
            // แสดงข้อมูลลูกค้าที่บันทึก
            displayCustomerInfo(formData);
            
            // ส่งข้อมูลไปยังเซิร์ฟเวอร์ (ถ้าเซิร์ฟเวอร์พร้อม)
            fetch('/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('ข้อมูลส่งไปยังเซิร์ฟเวอร์เรียบร้อย');
                } else {
                    console.log('เซิร์ฟเวอร์คืนข้อความ:', data.message);
                }
            })
            .catch(error => {
                console.log('เซิร์ฟเวอร์ไม่พร้อม แต่ข้อมูลถูกบันทึกใน localStorage');
            });
        }
    });
};

// ฟังก์ชันตรวจสอบความถูกต้องของฟอร์ม
function validateForm(name, email, phone, address, city, postal) {
    if (name.trim() === "") {
        alert("กรุณากรอกชื่อ-นามสกุล");
        return false;
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailPattern.test(email)) {
        alert("กรุณากรอกอีเมลที่ถูกต้อง");
        return false;
    }

    const phonePattern = /^\d{10}$/;
    if (!phonePattern.test(phone)) {
        alert("กรุณากรอกหมายเลขโทรศัพท์ 10 หลัก");
        return false;
    }

    if (address.trim() === "") {
        alert("กรุณากรอกที่อยู่");
        return false;
    }

    if (city.trim() === "") {
        alert("กรุณากรอกเมือง");
        return false;
    }

    const postalPattern = /^\d{5}$/;
    if (!postalPattern.test(postal)) {
        alert("กรุณากรอกรหัสไปรษณีย์ 5 หลัก");
        return false;
    }

    console.log("Validation passed");  // เพิ่มการตรวจสอบว่าผ่าน validation หรือไม่
    return true;
}

// ฟังก์ชันแสดงข้อมูลลูกค้า
function displayCustomerInfo(data) {
    document.getElementById('display-name').textContent = data.name;
    document.getElementById('display-email').textContent = data.email;
    document.getElementById('display-phone').textContent = data.phone;
    document.getElementById('display-address').textContent = data.address;
    document.getElementById('display-city').textContent = data.city;
    document.getElementById('display-postal').textContent = data.postal;
    
    // ซ่อนฟอร์มและแสดงข้อมูลลูกค้า
    document.getElementById('customer-form').style.display = 'none';
    document.getElementById('customer-display').style.display = 'block';
    
    // ล้างค่าฟอร์ม
    document.getElementById('customer-form').reset();
}

// ฟังก์ชันโหลดข้อมูลลูกค้าจาก localStorage
function loadCustomerData() {
    const savedData = localStorage.getItem('customerData');
    if (savedData) {
        const data = JSON.parse(savedData);
        displayCustomerInfo(data);
    }
}

// ฟังก์ชันแก้ไขข้อมูลลูกค้า
function editCustomerInfo() {
    document.getElementById('customer-form').style.display = 'block';
    document.getElementById('customer-display').style.display = 'none';
    localStorage.removeItem('customerData');
}

// ฟังก์ชันเช็คข้อมูลที่บันทึกแล้ว
function checkSavedCustomerData() {
    const savedData = localStorage.getItem('customerData');
    console.log('ค้นหา customerData:', savedData);
    
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            console.log('พบข้อมูล:', data);
            displayCustomerInfo(data);
            alert('พบข้อมูลลูกค้าที่บันทึกไว้');
        } catch (error) {
            console.error('Error parsing data:', error);
            alert('ข้อมูลในระบบเสียหาย กรุณากรอกใหม่');
            localStorage.removeItem('customerData');
        }
    } else {
        console.log('ไม่พบข้อมูล localStorage');
        alert('ไม่พบข้อมูลลูกค้าที่บันทึก กรุณากรอกข้อมูลใหม่');
        document.getElementById('customer-form').style.display = 'block';
        document.getElementById('customer-display').style.display = 'none';
    }
}
