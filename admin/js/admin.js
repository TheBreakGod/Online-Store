// Global variables
let adminToken = null;
let currentPage = 'dashboard';
let currentOrdersPage = 1;
let currentProductsPage = 1;
let currentCustomersPage = 1;

// Toggle sidebar for mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    adminToken = localStorage.getItem('adminToken');
    
    if (!adminToken) {
        window.location.href = './loginAM.html';
        return;
    }

    // Set up navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (item.textContent.includes('Logout')) return;
            e.preventDefault();
            const page = item.getAttribute('data-page');
            switchPage(page);
            // Close sidebar on mobile
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('open');
                document.querySelector('.sidebar-overlay').classList.remove('show');
            }
        });
    });

    // Load initial data
    loadDashboardData();
    loadOrders();
});

// Switch between pages
function switchPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
        p.style.display = 'none';
    });

    // Show selected page
    document.getElementById(`${page}-page`).style.display = 'block';

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === page) {
            item.classList.add('active');
        }
    });

    currentPage = page;

    // Load data for the page
    if (page === 'orders') {
        loadOrders();
    } else if (page === 'products') {
        loadProducts();
    } else if (page === 'customers') {
        loadCustomers();
    } else if (page === 'dashboard') {
        loadDashboardData();
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        const response = await fetch('/api/admin/orders/stats/summary', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (!response.ok) throw new Error('Failed to fetch stats');

        const result = await response.json();
        const stats = result.data.byStatus || [];

        let totalOrders = result.data.total;
        let pendingOrders = 0;
        let processingOrders = 0;
        let shippedOrders = 0;
        let deliveredOrders = 0;
        let totalRevenue = 0;

        stats.forEach(stat => {
            if (stat._id === 'pending') pendingOrders = stat.count;
            if (stat._id === 'processing') processingOrders = stat.count;
            if (stat._id === 'shipped') shippedOrders = stat.count;
            if (stat._id === 'delivered') deliveredOrders = stat.count;
            totalRevenue += stat.totalAmount;
        });

        // ✅ Check if elements exist before setting text
        const totalOrdersEl = document.getElementById('totalOrders');
        const pendingOrdersEl = document.getElementById('pendingOrders');
        const shippedOrdersEl = document.getElementById('shippedOrders');
        const deliveredOrdersEl = document.getElementById('deliveredOrders');
        const totalRevenueEl = document.getElementById('totalRevenue');

        if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
        if (pendingOrdersEl) pendingOrdersEl.textContent = pendingOrders;
        if (shippedOrdersEl) shippedOrdersEl.textContent = shippedOrders;
        if (deliveredOrdersEl) deliveredOrdersEl.textContent = deliveredOrders;
        if (totalRevenueEl) totalRevenueEl.textContent = `฿${totalRevenue.toLocaleString('th-TH')}`;
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load Orders
async function loadOrders(page = 1, status = '') {
    try {
        // Load all orders without pagination to group by status
        const response = await fetch(`/api/admin/orders?page=1&limit=100`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (!response.ok) throw new Error('Failed to fetch orders');

        const result = await response.json();
        const orders = result.data || [];

        // Group orders by status
        const groupedOrders = {
            pending: [],
            processing: [],
            shipped: [],
            delivered: [],
            cancelled: []
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
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px;">No orders</td></tr>`;
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
                <button class="btn btn-sm btn-success" onclick="updateOrderStatusTo('${order._id}', 'processing')">รับงาน</button>
                <button class="btn btn-sm" onclick="viewOrderDetail('${order._id}')">ดู</button>
            `;
        } else if (currentStatus === 'processing') {
            actionButtons = `
                <button class="btn btn-sm btn-primary" onclick="updateOrderStatusTo('${order._id}', 'shipped')">เสร็จสิ้น</button>
                <button class="btn btn-sm" onclick="viewOrderDetail('${order._id}')">ดู</button>
            `;
        } else if (currentStatus === 'shipped') {
            actionButtons = `
                <button class="btn btn-sm btn-info" onclick="updateOrderStatusTo('${order._id}', 'delivered')">ส่งถึงแล้ว</button>
                <button class="btn btn-sm" onclick="viewOrderDetail('${order._id}')">ดู</button>
            `;
        } else if (currentStatus === 'delivered') {
            actionButtons = `
                <button class="btn btn-sm" onclick="viewOrderDetail('${order._id}')">ดู</button>
            `;
        }

        row.innerHTML = `
            <td>${order._id.substring(0, 8)}...</td>
            <td>${order.user_id?.username || 'N/A'}</td>
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
        const response = await fetch(`/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
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
        loadDashboardData();
    } catch (error) {
        console.error('Error updating order:', error);
        alert('Failed to update order status');
    }
}

// Filter Orders
function filterOrders() {
    // No longer needed - orders automatically grouped by status
}

// Open Status Modal
function openStatusModal(orderId, currentStatus) {
    document.getElementById('statusModal').style.display = 'block';
    document.getElementById('statusModalOrderId').textContent = orderId;
    document.getElementById('statusSelect').value = currentStatus;
    document.getElementById('statusModal').dataset.orderId = orderId;
}

// Close Status Modal
function closeStatusModal() {
    document.getElementById('statusModal').style.display = 'none';
}

// Update Order Status
async function updateOrderStatus() {
    try {
        const orderId = document.getElementById('statusModal').dataset.orderId;
        const status = document.getElementById('statusSelect').value;

        const response = await fetch(`/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) throw new Error('Failed to update order');

        alert('Order status updated successfully');
        closeStatusModal();
        loadOrders(currentOrdersPage);
        loadDashboardData();
    } catch (error) {
        console.error('Error updating order:', error);
        alert('Failed to update order status');
    }
}

// View Order Detail
async function viewOrderDetail(orderId) {
    try {
        const response = await fetch(`/api/admin/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (!response.ok) throw new Error('Failed to fetch order details');

        const result = await response.json();
        const order = result.data.order;

        // Create detailed view
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

        const detailHTML = `
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>ลูกค้า:</strong> ${order.user_id?.username || 'Guest'}</p>
            <p><strong>สถานะ:</strong> <span class="status-badge status-${order.status}">${order.status}</span></p>
            <p><strong>วันที่สั่ง:</strong> ${new Date(order.created_at).toLocaleDateString('th-TH')}</p>
            
            <h4>สินค้าในออเดอร์:</h4>
            ${itemsHTML}
            
            <p style="margin-top: 20px; font-size: 18px; font-weight: bold;">
                <strong>ราคารวม:</strong> ฿${order.total_price.toLocaleString('th-TH')}
            </p>
        `;

        document.getElementById('orderDetailContent').innerHTML = detailHTML;
        document.getElementById('orderDetailModal').style.display = 'block';
    } catch (error) {
        console.error('Error viewing order details:', error);
        alert('Failed to load order details');
    }
}

// Close Order Detail Modal
function closeOrderDetailModal() {
    document.getElementById('orderDetailModal').style.display = 'none';
}

// Load Products
async function loadProducts(page = 1, category = '') {
    try {
        let url = `/api/admin/products?page=${page}&limit=10`;
        if (category) url += `&category=${category}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }

        const result = await response.json();
        const products = result.data || [];
        const pagination = result.pagination || {};

        const tbody = document.getElementById('productsTableBody');
        tbody.innerHTML = '';

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No products found</td></tr>';
            return;
        }

        products.forEach(product => {
            const row = document.createElement('tr');
            const statusBadge = `<span class="status-badge ${product.isActive ? 'status-active' : 'status-inactive'}">${product.isActive ? 'Active' : 'Inactive'}</span>`;
            const date = new Date(product.created_at).toLocaleDateString('th-TH');
            const categoryName = getCategoryName(product.category_id);

            row.innerHTML = `
                <td>${product.product_name}</td>
                <td>${categoryName}</td>
                <td>฿${product.price.toLocaleString('th-TH')}</td>
                <td>${statusBadge}</td>
                <td>${date}</td>
                <td>
                    <button class="btn btn-sm" onclick="editProduct('${product._id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product._id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Render pagination
        renderPagination('productsPagination', pagination, (p) => loadProducts(p, category));
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Error loading products: ' + error.message);
    }
}

// Filter Products
function filterProducts() {
    const category = document.getElementById('categoryFilter').value;
    currentProductsPage = 1;
    loadProducts(currentProductsPage, category);
}

// Get Category Name
function getCategoryName(categoryId) {
    const categories = {
        1: 'ซูเปอร์มาร์เก็ต',
        2: 'หนังสือ นิตยสาร เครื่องเขียน',
        3: 'แม่และเด็ก',
        4: 'สุขภาพ ออกกำลังกาย',
        5: 'เครื่องใช้ไฟฟ้า',
        6: 'บ้านและสวน',
        7: 'ความงาม',
        8: 'แฟชั่น',
        9: 'มือถือ แกดเจ็ต',
        10: 'สัตว์เลี้ยง'
    };
    return categories[categoryId] || 'Unknown';
}

// Open Product Modal
function openProductModal() {
    document.getElementById('productModal').style.display = 'block';
    document.getElementById('productId').value = '';
    document.getElementById('productForm').reset();
}

// Close Product Modal
function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

// Save Product
async function saveProduct(e) {
    if (e) e.preventDefault();
    
    try {
        const productIdEl = document.getElementById('productId');
        const nameEl = document.getElementById('productName');
        const priceEl = document.getElementById('productPrice');
        const imageFileEl = document.getElementById('product_image_file');
        const imageUrlEl = document.getElementById('productImage');

        // ✅ ป้องกันไม่ให้ undefined/null element ทำให้ error
        if (!productIdEl || !nameEl || !priceEl) {
            console.error('❌ Form elements not found');
            alert('Form error: Missing form elements');
            return;
        }

        const productId = productIdEl.value;
        const name = nameEl.value.trim();
        const price = priceEl.value.trim();
        const imageFile = imageFileEl?.files[0];
        const imageUrl = imageUrlEl?.value?.trim() || null;

        console.log('=== SAVE PRODUCT DEBUG ===');
        console.log('productId:', productId);
        console.log('name:', name);
        console.log('price:', price);
        console.log('imageFile:', imageFile ? '✅ มีไฟล์ - ' + imageFile.name : '❌ ไม่มีไฟล์');
        console.log('imageUrl:', imageUrl);

        if (!name || !price) {
            alert('Please fill in all required fields (Name, Price)');
            return;
        }

        // ถ้ามีการ upload file ใหม่
        if (imageFile) {
            console.log('📤 เข้า branch: upload file');
            const formData = new FormData();
            formData.append('product_name', name);
            formData.append('price', parseInt(price));
            formData.append('image', imageFile);

            const method = productId ? 'PUT' : 'POST';
            const url = productId ? `/api/admin/products/${productId}` : '/api/admin/products';

            console.log('📤 Uploading product with image...');
            console.log('URL:', url, 'METHOD:', method);
            console.log('File name:', imageFile.name, 'Size:', imageFile.size);

            const response = await fetch(url, {
                method,
                body: formData
                // ไม่ต้องตั้ง Content-Type header เพราะ browser จะตั้งให้อัตโนมัติ
            });

            const data = await response.json();
            console.log('✅ Response from server:', data);

            if (!response.ok) {
                console.error('❌ Server error:', data);
                throw new Error(data.message || 'Failed to save product');
            }

            alert(productId ? 'Product updated successfully' : 'Product created successfully');
            closeProductModal();
            loadProducts(currentProductsPage);
        } 
        // ถ้าส่ง image URL ทั่วไป
        else {
            console.log('📝 เข้า branch: JSON (no file)');
            const method = productId ? 'PUT' : 'POST';
            const url = productId ? `/api/admin/products/${productId}` : '/api/admin/products';

            // ✅ ถ้าเป็นการแก้ไขสินค้า (productId มีค่า) และ imageUrl ว่าง
            // ให้ส่ง undefined เพื่อไม่ให้ backend เปลี่ยน existing image URL
            const bodyData = {
                product_name: name,
                price: parseInt(price)
            };

            // ส่ง product_image_url เฉพาะเมื่อ:
            // - เป็น new product (no productId) 
            // - มีการตั้งค่า imageUrl ใหม่
            if (!productId || imageUrl) {
                bodyData.product_image_url = imageUrl;
            }

            console.log('Saving product:', bodyData);

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyData)
            });

            const data = await response.json();
            console.log('Response:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Failed to save product');
            }

            alert(productId ? 'Product updated successfully' : 'Product created successfully');
            closeProductModal();
            loadProducts(currentProductsPage);
        }
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Failed to save product: ' + error.message);
    }
}

// Edit Product
async function editProduct(productId) {
    try {
        const response = await fetch(`/api/admin/products/${productId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (!response.ok) throw new Error('Failed to fetch product');

        const result = await response.json();
        const product = result.data;

        document.getElementById('productId').value = product._id;
        document.getElementById('productName').value = product.product_name;
        document.getElementById('productPrice').value = product.price;
        
        // ✅ Set current image URL in the text input (ล็อคค่า)
        document.getElementById('productImage').value = product.product_image_url || '';
        
        // Clear file input
        document.getElementById('product_image_file').value = '';

        openProductModal();
    } catch (error) {
        console.error('Error editing product:', error);
        alert('Failed to load product details');
    }
}

// Delete Product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await fetch(`/api/admin/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (!response.ok) throw new Error('Failed to delete product');

        alert('Product deleted successfully');
        loadProducts(currentProductsPage);
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
    }
}

// Load Customers
async function loadCustomers(page = 1) {
    try {
        const url = `/api/admin/customers?page=${page}&limit=10`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (!response.ok) throw new Error('Failed to fetch customers');

        const result = await response.json();
        const customers = result.data;
        const pagination = result.pagination;

        const tbody = document.getElementById('customersTableBody');
        tbody.innerHTML = '';

        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No customers found</td></tr>';
            return;
        }

        customers.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer._id}</td>
                <td>${customer.username}</td>
                <td>${customer.email}</td>
                <td>${customer.totalOrders || 0}</td>
                <td>฿${(customer.totalSpent || 0).toLocaleString('th-TH')}</td>
                <td>
                    <button class="btn btn-sm" onclick="viewCustomerDetails('${customer._id}')">View</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Render pagination
        renderPagination('customersPagination', pagination, (p) => loadCustomers(p));
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

// View Customer Details
function viewCustomerDetails(customerId) {
    alert('Customer ID: ' + customerId);
}

// Render Pagination
function renderPagination(elementId, pagination, callback) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';

    if (pagination.pages <= 1) return;

    for (let i = 1; i <= pagination.pages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.className = i === pagination.page ? 'active' : '';
        button.onclick = () => callback(i);
        container.appendChild(button);
    }
}

// Logout
async function logoutAdmin() {
    try {
        const response = await fetch('/api/admin/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (response.ok) {
            localStorage.removeItem('adminToken');
            window.location.href = './loginAM.html';
        }
    } catch (error) {
        console.error('Error logging out:', error);
        localStorage.removeItem('adminToken');
        window.location.href = './loginAM.html';
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    let modal = document.getElementById('statusModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
    modal = document.getElementById('productModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
