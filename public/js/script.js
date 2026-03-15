// ========== SLIDER FUNCTIONS ==========
const slidesContainer = document.querySelector('.slides');
const slides = slidesContainer ? slidesContainer.children : [];
const totalSlides = slides.length;
let currentSlide = 0;

function showSlide(index) {
    if (slidesContainer) {
        slidesContainer.style.transform = `translateX(${-index * 100}%)`;
    }
}

function autoSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    showSlide(currentSlide);
}

if (totalSlides > 0) {
    setInterval(autoSlide, 5500);
}


// ========== CART VARIABLES ==========
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// ========== MAIN INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Page loaded, initializing...');
    
    // โหลดสินค้าหมวดหมู่ 1 ตั้งแต่เริ่มต้น
    fetchProducts(1);
    
    // จับ click event ของ category links
    const categoryLinks = document.querySelectorAll('.category-link');
    categoryLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const categoryId = link.getAttribute('data-category');
            console.log('📂 Category clicked:', categoryId);
            fetchProducts(categoryId);
        });
    });
    
    // อัปเดต cart count
    updateCartCount();
    renderCartItems();
});

// ========== FETCH & DISPLAY PRODUCTS ==========
function fetchProducts(categoryId) { 
    console.log('🔄 Fetching products for category:', categoryId);
    
    fetch(`/api/products?category=${categoryId}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response error');
            return response.json();
        })
        .then(products => {
            console.log('✅ Got products:', products.length);
            displayProducts(products);
        })
        .catch(error => {
            console.error('❌ Error fetching products:', error);
            const productContainer = document.getElementById('product-container');
            if (productContainer) {
                productContainer.innerHTML = '<p style="color:red;">ข้อผิดพลาด: ไม่สามารถโหลดสินค้า</p>';
            }
        });
}

function displayProducts(products) {
    const productContainer = document.getElementById('product-container');
    if (!productContainer) {
        console.error('❌ product-container not found!');
        return;
    }
    
    productContainer.innerHTML = '';
    
    if (!products || products.length === 0) {
        productContainer.innerHTML = '<p style="padding: 20px; text-align: center;">ไม่พบสินค้าในหมวดหมู่นี้</p>';
        return;
    }
    
    products.forEach(product => {
        // สร้าง element
        const div = document.createElement('div');
        div.className = 'product-item';
        
        // เตรียมรูปภาพ
        let imgHtml = '';
        if (product.product_image_url) {
            imgHtml = `<img src="${product.product_image_url}" alt="${product.product_name}" class="product-image" style="width:100%; height:150px; object-fit:cover; background:#f0f0f0;">`;
        } else {
            // placeholder ง่าย ๆ
            imgHtml = `<div style="width:100%; height:150px; background:#ccc; display:flex; align-items:center; justify-content:center; color:#666; font-size:12px;">ไม่มีรูป</div>`;
        }
        
        // ป้อนเนื้อหา
        const productId = product._id || '';
        const productName = product.product_name || 'ไม่ระบุ';
        const productPrice = product.price || 0;
        
        div.innerHTML = `
            ${imgHtml}
            <h3 style="margin: 10px 0; font-size: 14px;">${productName}</h3>
            <p style="margin: 5px 0; color: #e74c3c; font-weight: bold;">฿${productPrice}</p>
            <button class="add-to-cart-btn" 
                data-id="${productId}" 
                data-name="${productName}" 
                data-price="${productPrice}"
                data-image="${product.product_image_url || ''}"
                style="width: 100%; padding: 8px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                เพิ่มสินค้า
            </button>
        `;
        
        productContainer.appendChild(div);
    });
    
    // ตั้งค่า click event สำหรับปุ่มเพิ่มสินค้า
    setupAddToCartButtons();
}

function setupAddToCartButtons() {
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.getAttribute('data-id');
            const name = button.getAttribute('data-name');
            const price = parseFloat(button.getAttribute('data-price'));
            const image = button.getAttribute('data-image');
            
            console.log(`➕ Adding: ${name} (${price}) with image: ${image}`);
            addToCart(id, name, price, image);
        });
    });
}





// ========== CART FUNCTIONS ==========
function addToCart(id, name, price, image = '') {
    const existing = cart.find(item => item.id === id);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            image: image,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
}

function updateCartCount() {
    const element = document.getElementById('cartCount');
    if (element) {
        const total = cart.reduce((sum, item) => sum + item.quantity, 0);
        element.textContent = total;
    }
}

function toggleCart() {
    const container = document.getElementById('cart-container');
    if (container) {
        container.style.display = container.style.display === 'block' ? 'none' : 'block';
    }
}

function closeCart() {
    const container = document.getElementById('cart-container');
    if (container) {
        container.style.display = 'none';
    }
}

function renderCartItems() {
    const container = document.getElementById('cartItems');
    if (!container) return;
    
    container.innerHTML = '';
    let total = 0;
    let itemCount = 0;
    
    // ถ้าตะกร้าว่าง ให้แสดง message
    if (cart.length === 0) {
        container.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">ตะกร้าสินค้าว่าง</p>';
        
        const itemCountEl = document.getElementById('cartItemCount');
        if (itemCountEl) itemCountEl.textContent = '0';
        
        const totalEl = document.getElementById('cartTotal');
        if (totalEl) totalEl.textContent = 'รวม: 0 บาท';
        
        const headerItemCountEl = document.getElementById('cartHeaderItemCount');
        if (headerItemCountEl) headerItemCountEl.textContent = '0';
        
        const headerTotalEl = document.getElementById('cartHeaderTotal');
        if (headerTotalEl) headerTotalEl.textContent = '0';
        
        return;
    }
    
    cart.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.style.cssText = 'display: flex; align-items: center; gap: 15px; padding: 12px; border-bottom: 1px solid #eee; margin-bottom: 10px;';
        
        // Prepare image - ขยายเป็น 120x120px
        let imgHtml = '';
        if (item.image) {
            imgHtml = `<img src="${item.image}" alt="${item.name}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 6px; flex-shrink: 0;">`;
        } else {
            imgHtml = `<div style="width: 120px; height: 120px; background: #ccc; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #666; flex-shrink: 0;">ไม่มีรูป</div>`;
        }
        
        div.innerHTML = `
            ${imgHtml}
            <div style="flex: 1; min-width: 0;">
                <h4 style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600; word-break: break-word;">${item.name}</h4>
                <p style="margin: 0 0 8px 0; color: #e74c3c; font-weight: bold; font-size: 15px;">฿${item.price.toLocaleString('th-TH')}</p>
                <div style="display: flex; gap: 5px; align-items: center;">
                    <button onclick="changeQuantity(${idx}, -1)" style="padding: 4px 8px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 3px; cursor: pointer;">-</button>
                    <span style="min-width: 25px; text-align: center; font-weight: 600;">${item.quantity}</span>
                    <button onclick="changeQuantity(${idx}, 1)" style="padding: 4px 8px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 3px; cursor: pointer;">+</button>
                    <button onclick="removeFromCart(${idx})" style="padding: 4px 8px; background: #e74c3c; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">ลบ</button>
                </div>
            </div>
            <div style="text-align: right; flex-shrink: 0;">
                <p style="margin: 0; font-size: 14px; font-weight: 600;">รวม:</p>
                <p style="margin: 5px 0 0 0; color: #e74c3c; font-weight: bold; font-size: 15px;">฿${(item.price * item.quantity).toLocaleString('th-TH')}</p>
            </div>
        `;
        container.appendChild(div);
        total += item.price * item.quantity;
        itemCount += item.quantity;
    });
    
    // อัปเดตจำนวนสินค้า (ถ้า element มีอยู่)
    const itemCountEl = document.getElementById('cartItemCount');
    if (itemCountEl) {
        itemCountEl.textContent = itemCount;
    }
    
    // อัปเดตราคารวม (ถ้า element มีอยู่)
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) {
        totalEl.textContent = `รวม: ${total.toLocaleString('th-TH')} บาท`;
    }
    
    // อัปเดต header summary (อื่นๆเสมอ)
    const headerItemCountEl = document.getElementById('cartHeaderItemCount');
    if (headerItemCountEl) {
        headerItemCountEl.textContent = itemCount;
    }
    
    const headerTotalEl = document.getElementById('cartHeaderTotal');
    if (headerTotalEl) {
        headerTotalEl.textContent = total.toLocaleString('th-TH');
    }
}

function changeQuantity(idx, delta) {
    if (cart[idx]) {
        cart[idx].quantity += delta;
        if (cart[idx].quantity < 1) {
            cart.splice(idx, 1);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        renderCartItems();
    }
}

function removeFromCart(idx) {
    cart.splice(idx, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
}

function clearCart() {
    if (confirm('ต้องการลบสินค้าทั้งหมด?')) {
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        renderCartItems();
    }
}

// ========== CHECKOUT ==========
async function checkout() {
    if (cart.length === 0) {
        alert('ตะกร้าว่างเปล่า!');
        return;
    }
    
    try {
        const userId = localStorage.getItem('userId') || 'guest';
        
        // Calculate total price
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Prepare items array
        const items = cart.map(item => ({
            product_id: item.id,
            product_name: item.name,
            product_price: item.price,
            quantity: item.quantity
        }));
        
        // Send single request with all items
        const response = await fetch('/api/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                items: items,
                total_price: totalPrice,
                status: 'pending'
            })
        });
        
        if (!response.ok) throw new Error('Failed to submit order');
        
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        renderCartItems();
        closeCart();
        
        alert('✅ ชำระสำเร็จ! ออเดอร์ถูกส่งไปยังแอดมิน');
    } catch (error) {
        console.error('Checkout error:', error);
        alert('❌ เกิดข้อผิดพลาด: ' + error.message);
    }
}



// ========== SEARCH PRODUCTS ==========
function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    
    if (!searchTerm) {
        return;
    }
    
    console.log('🔍 Searching for:', searchTerm);
    
    fetch(`/search-products?query=${encodeURIComponent(searchTerm)}`)
        .then(response => response.json())
        .then(products => {
            console.log('✅ Search results:', products.length);
            displayProducts(products);
        })
        .catch(error => {
            console.error('❌ Search error:', error);
            alert('ไม่สามารถค้นหาได้');
        });
}



// ========== MENU ==========
function toggleMenu(event) {
    event.preventDefault();
    const menu = document.getElementById('dropdownMenu');
    if (menu) {
        menu.classList.toggle('hidden');
        menu.classList.toggle('visible');
    }
}

document.addEventListener('click', (event) => {
    const menu = document.getElementById('dropdownMenu');
    const icon = document.querySelector('.customer-icon');
    
    if (menu && icon && !icon.contains(event.target) && !menu.contains(event.target)) {
        menu.classList.add('hidden');
        menu.classList.remove('visible');
    }
});

// ========== SCROLL TO TOP ==========
const scrollBtn = document.getElementById('scrollToTop');
if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

window.addEventListener('scroll', () => {
    if (scrollBtn) {
        scrollBtn.style.display = (window.scrollY > 300) ? 'block' : 'none';
    }
});

console.log('✅ script.js loaded successfully');

