// ===================== UTILITY FUNCTIONS =====================
const getAdminToken = () => localStorage.getItem('adminToken');

// Toggle sidebar for mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
}

const checkAdminAuth = () => {
    const token = getAdminToken();
    if (!token) {
        window.location.href = '/admin/login.html';
        return false;
    }
    return true;
};

const fetchWithAuth = async (url, options = {}) => {
    const token = getAdminToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    console.log(`[fetchWithAuth] ${options.method || 'GET'} ${url}`);
    console.log('[fetchWithAuth] Headers:', headers);

    const response = await fetch(url, {
        ...options,
        headers
    });

    console.log(`[fetchWithAuth] Response status: ${response.status}`);

    // ถ้า 401 (Unauthorized) redirect ไปหน้า login
    if (response.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login.html';
        return null;
    }

    return response;
};

// ===================== INITIALIZATION =====================
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAdminAuth()) return;

    // Load user info
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    document.getElementById('adminName').textContent = adminUser.name || 'Admin';
    document.getElementById('adminEmail').textContent = adminUser.email || 'admin@easyshop.com';

    // Load initial dashboard
    loadDashboard();

    // Setup event listeners
    setupEventListeners();
});

// ===================== EVENT LISTENERS =====================
function setupEventListeners() {
    // Menu navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage(item.dataset.page);
            // Close sidebar on mobile
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('open');
                document.querySelector('.sidebar-overlay').classList.remove('show');
            }
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        const activePage = document.querySelector('.page-content.active');
        if (activePage.id === 'dashboard-page') loadDashboard();
        else if (activePage.id === 'products-page') loadProducts();
        else if (activePage.id === 'orders-page') loadOrders();

    });

    // Product search & filter
    document.getElementById('productSearch').addEventListener('input', debounce(loadProducts, 500));
    document.getElementById('productSearch').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); loadProducts(); }
    });
    document.getElementById('searchProductBtn').addEventListener('click', loadProducts);
    document.getElementById('categoryFilter').addEventListener('change', loadProducts);

    // Add product button
    document.getElementById('addProductBtn').addEventListener('click', openProductModal);

    // Product form submit
    document.getElementById('productForm').addEventListener('submit', saveProduct);

    // File input handler for image upload
    const fileInput = document.getElementById('product_image_file');
    if (fileInput) {
        fileInput.addEventListener('change', handleImageUpload);
    }

    // Remove image button
    const removeImageBtn = document.getElementById('removeImageBtn');
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', removeImage);
    }

    // Modal close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('show');
        });
    });

    // Modal outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('show');
        });
    });
}

// ===================== IMAGE UPLOAD HANDLER =====================
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const base64 = event.target.result;
        
        // เก็บ base64 ใน data attribute
        document.getElementById('product_image_file').dataset.base64 = base64;
        
        // แสดง preview
        const previewContainer = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        if (previewContainer && previewImg) {
            previewImg.src = base64;
            previewContainer.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    document.getElementById('product_image_file').value = '';
    document.getElementById('product_image_file').dataset.base64 = '';
    document.getElementById('imagePreview').style.display = 'none';
}

// ===================== PAGE SWITCHING =====================
function switchPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));

    // Show selected page
    document.getElementById(`${pageName}-page`).classList.add('active');
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    // Update header title
    const titles = {
        dashboard: 'Dashboard',
        products: 'Products Management',
        orders: 'Orders Management',
        orders: 'Orders Management'
    };
    document.getElementById('pageTitle').textContent = titles[pageName];

    // Load page data
    if (pageName === 'dashboard') loadDashboard();
    else if (pageName === 'products') loadProducts();
    else if (pageName === 'orders') loadOrders();
}

// ===================== DASHBOARD =====================
async function loadDashboard() {
    // Load product stats
    try {
        const res = await fetchWithAuth('/api/admin/products/stats/summary');
        if (res) {
            const productStats = await res.json();
            document.getElementById('totalProducts').textContent = productStats.data?.totalActive || 0;
        }
    } catch (e) { console.error('Error loading product stats:', e); }

    // Load order stats
    try {
        const res = await fetchWithAuth('/api/admin/orders/stats/summary');
        if (res) {
            const orderStats = await res.json();
            const totalOrders = orderStats.data?.total || 0;
            let totalRevenue = 0;
            if (orderStats.data?.byStatus) {
                totalRevenue = orderStats.data.byStatus.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
            }
            document.getElementById('totalOrders').textContent = totalOrders;
            document.getElementById('totalRevenue').textContent = `฿${totalRevenue.toLocaleString('th-TH')}`;
        }
    } catch (e) { console.error('Error loading order stats:', e); }

    // Load recent orders
    try {
        const res = await fetchWithAuth('/api/admin/orders?limit=5');
        if (res) {
            const orders = await res.json();
            renderRecentOrders(orders.data || []);
        }
    } catch (e) { console.error('Error loading recent orders:', e); }

    // Load top products
    try {
        const res = await fetchWithAuth('/api/admin/products?limit=5');
        if (res) {
            const products = await res.json();
            renderTopProducts(products.data || []);
        }
    } catch (e) { console.error('Error loading top products:', e); }
}

function renderRecentOrders(orders) {
    const tbody = document.getElementById('recentOrdersTable');
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No orders yet</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>${order._id.slice(-5)}</td>
            <td>${order.user_id?.name || 'Unknown'}</td>
            <td>฿${(order.total_price || 0).toLocaleString('th-TH')}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>${new Date(order.created_at).toLocaleDateString('th-TH')}</td>
        </tr>
    `).join('');
}

function renderTopProducts(products) {
    const categoryNames = {
        1: 'ซูเปอร์มาร์เก็ต', 2: 'หนังสือ นิตยสาร เครื่องเขียน', 3: 'แม่และเด็ก',
        4: 'สุขภาพ ออกกำลังกาย', 5: 'เครื่องใช้ไฟฟ้า', 6: 'บ้านและสวน',
        7: 'ความงาม', 8: 'แฟชั่น', 9: 'มือถือ แกดเจ็ต', 10: 'สัตว์เลี้ยง'
    };
    const tbody = document.getElementById('topProductsTable');
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No products yet</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.product_name}</td>
            <td>฿${product.price.toLocaleString('th-TH')}</td>
            <td>${categoryNames[product.category_id] || 'หมวด ' + product.category_id}</td>
            <td><span class="status-badge status-${product.isActive ? 'active' : 'inactive'}">
                ${product.isActive ? 'Active' : 'Inactive'}
            </span></td>
        </tr>
    `).join('');
}

// ===================== PRODUCTS =====================
async function loadProducts() {
    try {
        const search = document.getElementById('productSearch').value;
        const category = document.getElementById('categoryFilter').value;
        const page = document.getElementById('productsPagination').dataset.page || 1;

        const url = new URL('/api/admin/products', window.location.origin);
        url.searchParams.append('page', page);
        url.searchParams.append('limit', 10);
        if (search) url.searchParams.append('search', search);
        if (category) url.searchParams.append('category', category);

        const res = await fetchWithAuth(url);
        const response = await res.json();

        renderProductsTable(response.data || []);
        renderPagination('productsPagination', response.pagination, loadProducts);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function renderProductsTable(products) {
    const categoryNames = {
        1: 'ซูเปอร์มาร์เก็ต', 2: 'หนังสือ นิตยสาร เครื่องเขียน', 3: 'แม่และเด็ก',
        4: 'สุขภาพ ออกกำลังกาย', 5: 'เครื่องใช้ไฟฟ้า', 6: 'บ้านและสวน',
        7: 'ความงาม', 8: 'แฟชั่น', 9: 'มือถือ แกดเจ็ต', 10: 'สัตว์เลี้ยง'
    };
    const tbody = document.getElementById('productsTable');
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No products found</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.product_name}</td>
            <td>฿${product.price.toLocaleString('th-TH')}</td>
            <td>${categoryNames[product.category_id] || 'หมวด ' + product.category_id}</td>
            <td><span class="status-badge status-${product.isActive ? 'active' : 'inactive'}">
                ${product.isActive ? 'Active' : 'Inactive'}
            </span></td>
            <td>
                <button class="btn btn-small" onclick="editProduct('${product._id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteProduct('${product._id}')">
                    ${product.isActive ? 'Delete' : 'Restore'}
                </button>
            </td>
        </tr>
    `).join('');
}

function openProductModal() {
    document.getElementById('productId').value = '';
    document.getElementById('productForm').reset();
    document.getElementById('product_image_file').dataset.base64 = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('modalTitle').textContent = 'Add Product';
    document.getElementById('productModal').classList.add('show');
}

async function editProduct(productId) {
    try {
        const res = await fetchWithAuth(`/api/admin/products/${productId}`);
        const response = await res.json();
        const product = response.data;

        document.getElementById('productId').value = product._id;
        document.getElementById('productName').value = product.product_name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCategory').value = product.category_id;
        
        // Load image if exists
        const fileInput = document.getElementById('product_image_file');
        if (product.product_image_url) {
            fileInput.dataset.base64 = product.product_image_url;
            const previewContainer = document.getElementById('imagePreview');
            const previewImg = document.getElementById('previewImg');
            if (previewContainer && previewImg) {
                previewImg.src = product.product_image_url;
                previewContainer.style.display = 'block';
            }
        }
        
        document.getElementById('modalTitle').textContent = 'Edit Product';
        document.getElementById('productModal').classList.add('show');
    } catch (error) {
        alert('Error loading product: ' + error.message);
    }
}

async function saveProduct(e) {
    e.preventDefault();

    const productIdEl = document.getElementById('productId');
    const nameEl = document.getElementById('productName');
    const priceEl = document.getElementById('productPrice');
    const categoryEl = document.getElementById('productCategory');
    const imageFileEl = document.getElementById('product_image_file');
    const imageUrlEl = document.getElementById('productImage');

    // ✅ Check all elements exist
    if (!productIdEl || !nameEl || !priceEl || !categoryEl) {
        console.error('❌ Form elements not found');
        alert('Form error: Missing form elements');
        return;
    }

    const productId = productIdEl.value;
    const name = nameEl.value.trim();
    const price = priceEl.value.trim();
    const category = categoryEl.value;
    const imageFile = imageFileEl?.files[0];
    const imageUrl = imageUrlEl?.value?.trim() || null;

    try {
        if (!name || !price || !category) {
            alert('Please fill in all required fields (Name, Price, Category)');
            return;
        }

        const method = productId ? 'PUT' : 'POST';
        const url = productId ? `/api/admin/products/${productId}` : '/api/admin/products';

        // If there's a file to upload
        if (imageFile) {
            const formData = new FormData();
            formData.append('product_name', name);
            formData.append('price', parseInt(price));
            formData.append('category_id', parseInt(category));
            formData.append('image', imageFile);

            // Use direct fetch for FormData - do NOT use fetchWithAuth
            // because it sets Content-Type: application/json which breaks FormData
            const res = await fetch(url, {
                method,
                body: formData,
                headers: {
                    'Authorization': `Bearer ${getAdminToken()}`
                }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to save product');
            }
        } else {
            // If no file, send JSON
            const res = await fetchWithAuth(url, {
                method,
                body: JSON.stringify({
                    product_name: name,
                    price: parseInt(price),
                    category_id: parseInt(category),
                    product_image_url: imageUrl
                })
            });

            if (!res.ok) throw new Error('Failed to save product');
        }

        document.getElementById('productModal').classList.remove('show');
        loadProducts();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const res = await fetchWithAuth(`/api/admin/products/${productId}`, { 
            method: 'DELETE'
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || 'Failed to delete product');
        }

        loadProducts();
        alert('Product deleted successfully!');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ===================== ORDERS =====================
async function loadOrders() {
    try {
        // Load all orders without pagination to group by status
        const url = new URL('/api/admin/orders', window.location.origin);
        url.searchParams.append('page', 1);
        url.searchParams.append('limit', 100);

        const res = await fetchWithAuth(url);
        const response = await res.json();
        const orders = response.data || [];

        // Group orders by status
        const groupedOrders = {
            pending: [],
            processing: [],
            shipped: [],
            delivered: [],
            cancelled: [],
            cancel_requested: []
        };

        orders.forEach(order => {
            if (groupedOrders[order.status]) {
                groupedOrders[order.status].push(order);
            }
        });

        // Render each status group
        renderOrdersByStatus('newOrders', groupedOrders.pending);
        renderOrdersByStatus('processingOrders', groupedOrders.processing);
        renderOrdersByStatus('inTransitOrders', groupedOrders.shipped);
        renderOrdersByStatus('deliveredOrders', groupedOrders.delivered);
        renderOrdersByStatus('cancelRequestedOrders', groupedOrders.cancel_requested);

    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function renderOrdersByStatus(bodyId, orders) {
    const tbody = document.getElementById(bodyId + 'Body');
    const countBadge = document.getElementById(bodyId + 'Count');

    // Update count badge
    if (countBadge) {
        countBadge.textContent = orders.length;
    }

    if (!tbody) return;

    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">No orders</td></tr>`;
        return;
    }

    orders.forEach(order => {
        const row = document.createElement('tr');
        const date = new Date(order.created_at).toLocaleDateString('th-TH');

        // Display items
        let itemsDisplay = 'N/A';
        let totalItems = 0;

        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
            totalItems = order.items.length;
            const itemNames = order.items.map(item => item.product_name).join(', ');
            itemsDisplay = totalItems > 1
                ? `${itemNames.substring(0, 30)}${itemNames.length > 30 ? '...' : ''}`
                : itemNames;
        } else if (order.product_name) {
            itemsDisplay = order.product_name;
            totalItems = order.quantity || 1;
        }

        // Determine action buttons based on status
        let actionButtons = '';
        const currentStatus = order.status;

        if (currentStatus === 'pending') {
            actionButtons = `
                <button class="btn btn-success" onclick="updateOrderStatusTo('${order._id}', 'processing')">รับงาน</button>
                <button class="btn btn-small" onclick="viewOrderDetail('${order._id}')">ดู</button>
            `;
        } else if (currentStatus === 'processing') {
            actionButtons = `
                <button class="btn btn-primary" onclick="updateOrderStatusTo('${order._id}', 'shipped')">เสร็จสิ้น</button>
                <button class="btn btn-small" onclick="viewOrderDetail('${order._id}')">ดู</button>
            `;
        } else if (currentStatus === 'shipped') {
            actionButtons = `
                <button class="btn btn-info" onclick="updateOrderStatusTo('${order._id}', 'delivered')">ส่งถึงแล้ว</button>
                <button class="btn btn-small" onclick="viewOrderDetail('${order._id}')">ดู</button>
            `;
        } else if (currentStatus === 'delivered') {
            actionButtons = `
                <button class="btn btn-small" onclick="viewOrderDetail('${order._id}')">ดู</button>
            `;
        } else if (currentStatus === 'cancel_requested') {
            actionButtons = `
                <button class="btn btn-danger" onclick="handleCancelRequest('${order._id}', 'approve')" style="font-size:12px;">✅ อนุมัติยกเลิก</button>
                <button class="btn btn-success" onclick="handleCancelRequest('${order._id}', 'reject')" style="font-size:12px;">❌ ปฏิเสธ</button>
                <button class="btn btn-small" onclick="viewOrderDetail('${order._id}')">ดู</button>
            `;
        }

        row.innerHTML = `
            <td>${order._id.slice(-5)}</td>
            <td>${order.user_id?.name || 'N/A'}</td>
            <td title="${order.items?.map(item => item.product_name).join(', ') || order.product_name || ''}">${itemsDisplay}</td>
            <td>${totalItems}</td>
            <td>฿${order.total_price.toLocaleString('th-TH')}</td>
            <td>${date}</td>
            <td>
                ${actionButtons}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update order status to specific value
async function updateOrderStatusTo(orderId, newStatus) {
    try {
        const response = await fetchWithAuth(`/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('Failed to update order');

        // Show success message based on new status
        let message = '';
        if (newStatus === 'processing') message = '✅ รับงาน - Order อยู่ระหว่างจัด';
        else if (newStatus === 'shipped') message = '✅ เสร็จสิ้น - Order อยู่ระหว่างจัดส่ง';
        else if (newStatus === 'delivered') message = '✅ ส่งถึงแล้ว';

        alert(message);
        loadOrders();
    } catch (error) {
        console.error('Error updating order:', error);
        alert('Failed to update order status');
    }
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById('ordersTable');
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No orders found</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>${order._id.slice(-5)}</td>
            <td>${order.user_id?.name || 'Unknown'}</td>
            <td>฿${(order.total_price || 0).toLocaleString('th-TH')}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>${new Date(order.created_at).toLocaleDateString('th-TH')}</td>
            <td>
                <button class="btn btn-small" onclick="viewOrderDetail('${order._id}')">View</button>
            </td>
        </tr>
    `).join('');
}

async function viewOrderDetail(orderId) {
    try {
        const res = await fetchWithAuth(`/api/admin/orders/${orderId}`);
        const response = await res.json();
        const { order, customerInfo } = response.data;

        // ข้อมูลที่อยู่ลูกค้า (แสดงเป็นข้อมูลหลัก)
        let addressHTML = '<div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #4CAF50;">';
        addressHTML += '<h4 style="margin-top: 0; color: #333;">📍 ข้อมูลลูกค้า / ที่อยู่จัดส่ง</h4>';
        if (customerInfo) {
            addressHTML += `
                <p><strong>ชื่อ:</strong> ${customerInfo.name || 'N/A'}</p>
                <p><strong>อีเมล:</strong> ${customerInfo.email || 'N/A'}</p>
                <p><strong>เบอร์โทร:</strong> ${customerInfo.phone || 'N/A'}</p>
                <p><strong>ที่อยู่:</strong> ${customerInfo.address || 'N/A'}</p>
                <p><strong>เมือง:</strong> ${customerInfo.city || 'N/A'}</p>
                <p><strong>รหัสไปรษณีย์:</strong> ${customerInfo.postal || 'N/A'}</p>
            `;
        } else {
            addressHTML += '<p style="color: #999;">ไม่มีข้อมูลที่อยู่</p>';
        }
        addressHTML += '</div>';

        // รายการสินค้า
        let itemsHTML = '';
        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
            itemsHTML = order.items.map(item => `
                <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                    <p><strong>สินค้า:</strong> ${item.product_name}</p>
                    <p><strong>ราคา:</strong> ฿${item.product_price.toLocaleString('th-TH')}</p>
                    <p><strong>จำนวน:</strong> ${item.quantity} ชิ้น</p>
                    <p><strong>รวม:</strong> ฿${(item.product_price * item.quantity).toLocaleString('th-TH')}</p>
                </div>
            `).join('');
        } else if (order.product_name) {
            itemsHTML = `
                <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                    <p><strong>สินค้า:</strong> ${order.product_name}</p>
                    <p><strong>ราคา:</strong> ฿${order.product_price?.toLocaleString('th-TH') || 'N/A'}</p>
                    <p><strong>จำนวน:</strong> ${order.quantity} ชิ้น</p>
                </div>
            `;
        }

        // ปุ่มย้อนสถานะ
        const previousStatusMap = { 'delivered': 'shipped', 'shipped': 'processing', 'processing': 'pending' };
        const prevStatus = previousStatusMap[order.status];
        let reverseHTML = '';
        if (prevStatus) {
            reverseHTML = `
                <div style="margin-top: 20px; padding: 12px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                    <p style="margin: 0 0 8px 0; font-size: 14px;">⚠️ หากเกิดข้อผิดพลาด สามารถย้อนสถานะกลับไปเป็น <strong>${prevStatus}</strong></p>
                    <button class="btn btn-warning" onclick="reverseOrderStatus('${order._id}', '${prevStatus}')" style="cursor:pointer;">
                        ↩️ ย้อนสถานะ → ${prevStatus}
                    </button>
                </div>
            `;
        }

        const detailHTML = `
            ${addressHTML}
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <p><strong>Order ID:</strong> ${order._id.slice(-5)}</p>
                <p><strong>วันที่สั่ง:</strong> ${new Date(order.created_at).toLocaleDateString('th-TH')}</p>
            </div>
            <h4>🛍️ สินค้าในออเดอร์:</h4>
            ${itemsHTML}
            <div style="margin-top: 15px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                <p style="font-size: 18px; font-weight: bold; margin: 0;">
                    ราคารวม: ฿${order.total_price.toLocaleString('th-TH')}
                </p>
            </div>
            ${reverseHTML}
        `;

        document.getElementById('orderDetailContent').innerHTML = detailHTML;
        document.getElementById('orderModal').classList.add('show');
    } catch (error) {
        alert('Error loading order: ' + error.message);
    }
}

// ย้อนสถานะ order (สำหรับแก้ไขข้อผิดพลาด)
async function reverseOrderStatus(orderId, newStatus) {
    if (!confirm(`คุณแน่ใจหรือว่าต้องการย้อนสถานะไปเป็น "${newStatus}"?`)) return;

    try {
        const res = await fetchWithAuth(`/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });

        if (!res.ok) throw new Error('Failed to reverse status');

        alert(`✔️ ย้อนสถานะเป็น ${newStatus} สำเร็จ`);
        document.getElementById('orderModal').classList.remove('show');
        loadOrders();
    } catch (error) {
        alert('❌ เกิดข้อผิดพลาด: ' + error.message);
    }
}

// จัดการคำขอยกเลิก order (approve / reject)
async function handleCancelRequest(orderId, action) {
    const actionText = action === 'approve' ? 'อนุมัติยกเลิก' : 'ปฏิเสธการยกเลิก';
    if (!confirm(`คุณแน่ใจหรือว่าต้องการ "${actionText}" ออเดอร์นี้?`)) return;

    // approve = เปลี่ยนเป็น cancelled, reject = เปลี่ยนกลับเป็น pending
    const newStatus = action === 'approve' ? 'cancelled' : 'pending';

    try {
        const res = await fetchWithAuth(`/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });

        if (!res.ok) throw new Error('Failed to process cancel request');

        alert(`✔️ ${actionText}เรียบร้อยแล้ว`);
        loadOrders();
    } catch (error) {
        alert('❌ เกิดข้อผิดพลาด: ' + error.message);
    }
}

// ===================== CUSTOMERS =====================
async function loadCustomers() {
    // kept for backward compatibility
}

// ===================== SEARCH PRODUCTS =====================
async function searchProducts() {
    const query = document.getElementById('globalProductSearch').value.trim();
    const resultsDiv = document.getElementById('searchResults');

    if (!query) {
        resultsDiv.innerHTML = '<p style="text-align:center; color:#999; padding:40px;">พิมพ์ชื่อสินค้าเพื่อค้นหา</p>';
        return;
    }

    try {
        const res = await fetch(`/search-products?query=${encodeURIComponent(query)}`);
        const products = await res.json();

        if (!products || products.length === 0) {
            resultsDiv.innerHTML = '<p style="text-align:center; color:#999; padding:40px;">ไม่พบสินค้าที่ค้นหา</p>';
            return;
        }

        resultsDiv.innerHTML = `
            <p style="margin-bottom: 15px; color: #666;">พบ ${products.length} รายการ</p>
            <table class="table">
                <thead>
                    <tr>
                        <th>รูป</th>
                        <th>ชื่อสินค้า</th>
                        <th>ราคา</th>
                        <th>หมวดหมู่</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(p => `
                        <tr>
                            <td>
                                ${p.product_image 
                                    ? `<img src="${p.product_image}" alt="${p.product_name}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;">` 
                                    : '<span style="color:#ccc;">ไม่มีรูป</span>'
                                }
                            </td>
                            <td>${p.product_name}</td>
                            <td>฿${p.price.toLocaleString('th-TH')}</td>
                            <td>${(p.category_ids || []).join(', ') || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Search error:', error);
        resultsDiv.innerHTML = '<p style="text-align:center; color:red;">เกิดข้อผิดพลาดในการค้นหา</p>';
    }
}

// ===================== PAGINATION =====================
function renderPagination(elementId, pagination, callback) {
    if (!pagination) return;

    const container = document.getElementById(elementId);
    let html = '';

    for (let i = 1; i <= pagination.pages; i++) {
        html += `<button class="${i === pagination.page ? 'active' : ''}" 
                 onclick="
                    document.getElementById('${elementId}').dataset.page = ${i};
                    ${callback.name}();
                 ">${i}</button>`;
    }

    container.innerHTML = html;
    container.dataset.page = pagination.page;
}

// ===================== UTILITIES =====================
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin/login.html';
}
