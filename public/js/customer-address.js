// จัดการข้อมูลที่อยู่ของลูกค้า
let addresses = [];
let primaryAddressId = null;
let editingAddressId = null;

window.onload = function () {
    const addressForm = document.getElementById('addressForm');
    
    // โหลดข้อมูลที่บันทึกไว้
    loadAddresses();
    
    // จัดการ submit ฟอร์ม
    addressForm.addEventListener('submit', function (event) {
        event.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const city = document.getElementById('city').value.trim();
        const postal = document.getElementById('postal').value.trim();
        
        // ตรวจสอบความถูกต้อง
        if (validateForm(name, email, phone, address, city, postal)) {
            if (editingAddressId) {
                // แก้ไขที่อยู่ที่มีอยู่
                const index = addresses.findIndex(addr => addr.id === editingAddressId);
                if (index !== -1) {
                    addresses[index] = {
                        id: editingAddressId,
                        name: name,
                        email: email,
                        phone: phone,
                        address: address,
                        city: city,
                        postal: postal
                    };
                    editingAddressId = null;
                }
            } else {
                // เพิ่มที่อยู่ใหม่
                const newAddress = {
                    id: Date.now(),
                    name: name,
                    email: email,
                    phone: phone,
                    address: address,
                    city: city,
                    postal: postal
                };
                
                addresses.push(newAddress);
                
                // ตั้งเป็นที่อยู่หลักถ้าเป็นรายการแรก
                if (addresses.length === 1) {
                    primaryAddressId = newAddress.id;
                }
            }
            
            // บันทึกลง localStorage
            saveAddresses();
            
            // รีเฟรชแสดงผล
            displayAddresses();
            
            // ล้างฟอร์ม
            addressForm.reset();
            const submitBtn = addressForm.querySelector('.btn-save');
            submitBtn.textContent = 'บันทึกข้อมูล';
            toggleAddressForm();
        }
    });
};

// ตรวจสอบความถูกต้องของฟอร์ม
function validateForm(name, email, phone, address, city, postal) {
    if (name === "") {
        alert("กรุณากรอกชื่อ");
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

    if (address === "") {
        alert("กรุณากรอกที่อยู่");
        return false;
    }

    if (city === "") {
        alert("กรุณากรอกจังหวัด");
        return false;
    }

    const postalPattern = /^\d{5}$/;
    if (!postalPattern.test(postal)) {
        alert("กรุณากรอกรหัสไปรษณีย์ 5 หลัก");
        return false;
    }

    return true;
}

// บันทึกข้อมูลลง localStorage
function saveAddresses() {
    const data = {
        addresses: addresses,
        primaryAddressId: primaryAddressId
    };
    localStorage.setItem('customerAddresses', JSON.stringify(data));
}

// โหลดข้อมูลจาก localStorage
function loadAddresses() {
    const savedData = localStorage.getItem('customerAddresses');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            addresses = data.addresses || [];
            primaryAddressId = data.primaryAddressId || null;
            displayAddresses();
        } catch (error) {
            console.error('Error loading addresses:', error);
        }
    }
}

// แสดงรายการที่อยู่
function displayAddresses() {
    const addressList = document.getElementById('addressList');
    
    if (addresses.length === 0) {
        addressList.innerHTML = '<p class="no-address">ยังไม่มีข้อมูลที่อยู่</p>';
        return;
    }
    
    let html = '';
    addresses.forEach((addr) => {
        const isPrimary = addr.id === primaryAddressId;
        html += `
            <div class="address-item ${isPrimary ? 'primary' : ''}">
                <div class="address-header">
                    <h4>${addr.name}</h4>
                    ${isPrimary ? '<span class="badge-primary">ที่อยู่หลัก</span>' : ''}
                </div>
                <div class="address-detail">
                    <p><strong>อีเมล:</strong> ${addr.email}</p>
                    <p><strong>เบอร์โทรศัพท์:</strong> ${addr.phone}</p>
                    <p><strong>ที่อยู่:</strong> ${addr.address}</p>
                    <p><strong>จังหวัด:</strong> ${addr.city}</p>
                    <p><strong>รหัสไปรษณีย์:</strong> ${addr.postal}</p>
                </div>
                <div class="address-actions">
                    <button class="btn-edit" onclick="editAddress(${addr.id})"><i class="fas fa-edit"></i> แก้ไข</button>
                    ${!isPrimary ? `<button class="btn-set-primary" onclick="setPrimaryAddress(${addr.id})">ตั้งเป็นที่อยู่หลัก</button>` : ''}
                    <button class="btn-delete" onclick="deleteAddress(${addr.id})"><i class="fas fa-trash"></i> ลบ</button>
                </div>
            </div>
        `;
    });
    
    addressList.innerHTML = html;
}

// ตั้งเป็นที่อยู่หลัก
function setPrimaryAddress(id) {
    primaryAddressId = id;
    saveAddresses();
    displayAddresses();
}

// ลบที่อยู่
function deleteAddress(id) {
    if (confirm('คุณแน่ใจว่าต้องการลบที่อยู่นี้หรือไม่?')) {
        addresses = addresses.filter(addr => addr.id !== id);
        
        // ถ้าลบที่อยู่หลัก ให้ตั้งที่อยู่แรกเป็นหลัก
        if (primaryAddressId === id) {
            primaryAddressId = addresses.length > 0 ? addresses[0].id : null;
        }
        
        saveAddresses();
        displayAddresses();
    }
}

// สลับแสดง/ซ่อนฟอร์ม
function toggleAddressForm() {
    const form = document.getElementById('addressForm');
    if (form.style.display === 'none') {
        form.style.display = 'block';
        // Scroll ไปที่ฟอร์ม
        form.scrollIntoView({ behavior: 'smooth' });
    } else {
        form.style.display = 'none';
    }
}

// แก้ไขที่อยู่
function editAddress(id) {
    const address = addresses.find(addr => addr.id === id);
    if (!address) return;
    
    // กำหนดให้รู้ว่ากำลังแก้ไข
    editingAddressId = id;
    
    // เติมข้อมูลลงในฟอร์ม
    document.getElementById('name').value = address.name;
    document.getElementById('email').value = address.email;
    document.getElementById('phone').value = address.phone;
    document.getElementById('address').value = address.address;
    document.getElementById('city').value = address.city;
    document.getElementById('postal').value = address.postal;
    
    // แสดงฟอร์มและ scroll ไป
    const form = document.getElementById('addressForm');
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
    
    // เปลี่ยนข้อความปุ่มบันทึก
    const submitBtn = form.querySelector('.btn-save');
    submitBtn.textContent = 'อัปเดตข้อมูล';
}

// ยกเลิกการแก้ไข
function cancelEdit() {
    editingAddressId = null;
    document.getElementById('addressForm').reset();
    const submitBtn = document.querySelector('.btn-save');
    submitBtn.textContent = 'บันทึกข้อมูล';
}
