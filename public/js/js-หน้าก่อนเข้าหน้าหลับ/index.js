let currentIndex = 0;
const slides = document.querySelector('.slides');
const totalSlides = slides ? slides.children.length : 0;

document.addEventListener('DOMContentLoaded', () => {
    // ตรวจสอบว่า .slides มีลูกอยู่จริงหรือไม่
    if (totalSlides > 0) {
        setInterval(showNextSlide, 5500); // เริ่มสไลด์อัตโนมัติทุก 3 วินาที
    } else {
        console.log("No slides found!");
    }
});

// ฟังก์ชันแสดงสไลด์ถัดไป
function showNextSlide() {
    if (totalSlides > 0) {
        currentIndex = (currentIndex + 1) % totalSlides; // เลื่อนไปยังสไลด์ถัดไป
        const offset = -currentIndex * 100; // คำนวณตำแหน่งใหม่
        slides.style.transform = `translateX(${offset}%)`; // ใช้ backticks สำหรับ template literal
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
});

// เพิ่ม Event Listener สำหรับลิงก์หมวดหมู่
document.querySelectorAll('.category-link').forEach(link => {
    link.addEventListener('click', event => {
        event.preventDefault(); // ป้องกันการเปลี่ยนหน้า
        const categoryId = event.target.closest('a').getAttribute('data-category');
        fetchProducts(categoryId); // เรียกฟังก์ชันดึงสินค้า
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // เริ่มต้นให้โหลดสินค้าหมวดหมู่ 1 โดยอัตโนมัติ
    fetchProducts(1);

    // จับเหตุการณ์คลิกบนเมนูหมวดหมู่
    const categoryLinks = document.querySelectorAll('.category-link');
    
    categoryLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();  // หยุดการทำงานของลิงก์แบบปกติ

            const categoryId = link.getAttribute('data-category'); // ดึง category จาก data-attribute
            fetchProducts(categoryId); // ดึงสินค้าใหม่ตามหมวดหมู่ที่เลือก
        });
    });
});


function fetchProducts(categoryId) { 
    fetch(`http://localhost:3000/api/products?category=${categoryId}`)
        .then(response => response.json())
        .then(products => {
            const productContainer = document.getElementById('product-container');
            productContainer.innerHTML = ''; // ล้างข้อมูลเก่า

            if (!products || products.length === 0) {
                productContainer.innerHTML = '<p>ไม่พบสินค้าในหมวดหมู่นี้</p>';
                return;
            }

            products.forEach(product => {
                const productElement = document.createElement('div');
                productElement.classList.add('product-item');

                // ตรวจสอบทั้ง product_image (ไฟล์ในเซิร์ฟเวอร์) และ product_image_url (URL)
                let imageUrl = 'default-image.jpg'; // กำหนดค่า default หากไม่พบรูปภาพ
                if (product.product_image) {
                    imageUrl = `/uploads/${product.product_image}`;  // ใช้ไฟล์รูปที่เก็บในเซิร์ฟเวอร์
                } else if (product.product_image_url) {
                    imageUrl = product.product_image_url;  // ใช้ URL ภายนอก
                }

                productElement.innerHTML = `
                    <img src="${imageUrl}" alt="${product.product_name}" class="product-image">
                    <h3>${product.product_name}</h3>
                    <p>฿${product.price}</p>
                    <button class="add-to-cart-btn" 
                        data-product-id="${product.id}" 
                        data-product-name="${product.product_name}" 
                        data-product-price="${product.price}">เพิ่มสินค้า</button>`;
                productContainer.appendChild(productElement);
            });

            setupAddToCartButtons(); // ตั้งค่าปุ่มเพิ่มสินค้า
        })
        .catch(error => {
            console.error('Error fetching products:', error);
        });
}


// โหลดสถานะการเข้าสู่ระบบเมื่อโหลดหน้า
let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

// เพิ่ม Event Listener ให้ปุ่ม "เพิ่มสินค้าลงตะกร้า"
function setupAddToCartButtons() {
    const buttons = document.querySelectorAll('.add-to-cart-btn');
    console.log("ปุ่มที่พบ:", buttons.length); // ตรวจสอบจำนวนปุ่มที่พบ

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.getAttribute('data-product-id');
            const productName = button.getAttribute('data-product-name');
            const productPrice = parseFloat(button.getAttribute('data-product-price'));

            console.log("ข้อมูลสินค้า:", { productId, productName, productPrice }); // Debugging

            // ตรวจสอบสถานะการเข้าสู่ระบบ
            if (!isLoggedIn) {
                alert("กรุณาทำการเข้าสู่ระบบก่อน!");
                window.location.href = "login.html"; // เปลี่ยนหน้าไปที่ login.html
                return;
            }

            // เพิ่มสินค้าในตะกร้าหากเข้าสู่ระบบแล้ว
            addToCart(productId, productName, productPrice);
        });
    });
}

// เรียกฟังก์ชันตั้งค่า Event Listener เมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', setupAddToCartButtons);


// ตัวแปรเก็บข้อมูลตะกร้า
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// เพิ่มสินค้าในตะกร้า (เพิ่มเป็นรายการใหม่เสมอ)
function addToCart(productId, productName, productPrice) {
    // เพิ่มสินค้าใหม่ลงในตะกร้าโดยไม่ตรวจสอบซ้ำ
    cart.push({
        id: productId,
        name: productName,
        price: productPrice,
        quantity: 1, // สินค้าใหม่เริ่มต้นที่จำนวน 1
    });

    // บันทึกข้อมูลตะกร้าใหม่ลงใน localStorage
    localStorage.setItem('cart', JSON.stringify(cart));

    // อัปเดต UI และแจ้งเตือนผู้ใช้
    updateCartCount();
    alert(`เพิ่ม "${productName}" ลงตะกร้าเรียบร้อยแล้ว!`);
    renderCartItems();
}

// อัปเดตจำนวนสินค้าในตะกร้า
function updateCartCount() {
    const cartCountElement = document.getElementById("cartCount");
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.textContent = totalItems;
    console.log("จำนวนสินค้าทั้งหมดในตะกร้า:", totalItems); // Debugging
}

// แสดงหรือซ่อนตะกร้าสินค้า
function toggleCart() {
    const cartContainer = document.getElementById("cart-container");
    cartContainer.style.display = cartContainer.style.display === "block" ? "none" : "block";
}

// อัปเดตรายการสินค้าในตะกร้า
function renderCartItems() {
    const cartItemsContainer = document.getElementById("cartItems");
    cartItemsContainer.innerHTML = ""; // ล้างรายการเก่า
    let total = 0;

    cart.forEach((item, index) => {
        const itemElement = document.createElement("div");
        itemElement.className = "cart-item";
        itemElement.innerHTML = `
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-price">${item.price} บาท</span>
            <span class="cart-item-quantity">
                ${item.quantity} 
                <button onclick="removeItem(${index})">ลบ</button>
            </span>
        `;
        cartItemsContainer.appendChild(itemElement);
        total += item.price * item.quantity;
    });

    const cartTotalElement = document.getElementById("cartTotal");
    cartTotalElement.textContent = `รวม: ${total} บาท`;
    console.log("ยอดรวมในตะกร้า:", total); // Debugging
}

// ลบสินค้าเฉพาะรายการออกจากตะกร้า
function removeItem(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
}

// ลบสินค้าทั้งหมดในตะกร้า
function clearCart() {
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
}

function closeCart() {
    const cart = document.getElementById('cart-container');
    cart.style.display = 'none';  // ซ่อนกรอบตะกร้า
}

// ชำระเงิน
function checkout() {
    if (cart.length === 0) {
        alert("ตะกร้าว่างเปล่า!");
    } else {
        alert("ชำระเงินสำเร็จ!");
        clearCart();
    }
}


function searchProducts() {
    const searchInput = document.getElementById('searchInput').value.trim(); // รับค่าจากช่องค้นหา

    // ส่งคำค้นหาไปยัง API
    fetch(`http://localhost:3000/search-products?query=${encodeURIComponent(searchInput)}`)
        .then(response => response.json())
        .then(products => {
            const productContainer = document.getElementById('product-container');
            productContainer.innerHTML = '';

            if (!products || products.length === 0) {
                productContainer.innerHTML = '<p>ไม่พบสินค้า</p>';
                return;
            }

            // จำกัดจำนวนสินค้าที่แสดงไม่เกิน 18 ชิ้น
            const limitedProducts = products.slice(0, 100);

            limitedProducts.forEach(product => {
                const productDiv = document.createElement('div');
                productDiv.classList.add('product-item'); // เพิ่มคลาสเพื่อใช้สไตล์

                const productImage = product.product_image ? `/uploads/${product.product_image}` : 'default-image.png';

                productDiv.innerHTML = `
                    <img src="${productImage}" alt="${product.product_name}">
                    <h3>${product.product_name}</h3>
                    <p>฿${product.price}</p>
                    <button class="add-to-cart" onclick="handleAddToCart(${product.id}, '${product.product_name}', ${product.price})">เพิ่มสินค้า</button>`;
                    
                productContainer.appendChild(productDiv);
            });
        })
        .catch(err => console.error('Error:', err));
}

// ฟังก์ชันสำหรับจัดการการเพิ่มสินค้าในตะกร้า
function handleAddToCart(productId, productName, productPrice) {
    // ตรวจสอบสถานะการเข้าสู่ระบบ
    if (!isLoggedIn) {
        alert("กรุณาทำการเข้าสู่ระบบก่อน!");
        window.location.href = "login.html"; // เปลี่ยนหน้าไปที่ login.html
        return;
    }

    // เพิ่มสินค้าในตะกร้าหากเข้าสู่ระบบแล้ว
    addToCart(productId, productName, productPrice);
}

// ฟังก์ชันตัวอย่างสำหรับเพิ่มสินค้าในตะกร้า (ปรับแต่งได้ตามต้องการ)
function addToCart(productId, productName, productPrice) {
    console.log(`เพิ่มสินค้า: ID=${productId}, ชื่อ=${productName}, ราคา=${productPrice}`);
    // โค้ดสำหรับเพิ่มสินค้าในตะกร้าของคุณ
}



// คำสั่งให้เลื่อนหน้าขึ้นเมื่อคลิกที่ปุ่ม
document.getElementById('scrollToTop').addEventListener('click', function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // ทำให้การเลื่อนนุ่มนวล
    });
});
window.onscroll = function() {
    const scrollToTopButton = document.getElementById('scrollToTop');
    // แสดงปุ่มเมื่อเลื่อนลงมาถึง 300px
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        scrollToTopButton.style.display = "block"; // แสดงปุ่ม
    } else {
        scrollToTopButton.style.display = "none"; // ซ่อนปุ่ม
    }
};


// ฟังก์ชันเพื่อให้ตะกร้าสินค้าเริ่มต้นแสดงเมื่อหน้าโหลด
showCart();
fetchProducts();
updateCartCount();














