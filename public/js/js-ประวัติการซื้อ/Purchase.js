// สถานะภาษาไทย
const statusLabels = {
    'pending': '🕐 รอดำเนินการ',
    'processing': '⚙️ กำลังจัดเตรียม',
    'shipped': '🚚 อยู่ระหว่างจัดส่ง',
    'delivered': '✅ จัดส่งสำเร็จ',
    'cancelled': '❌ ยกเลิกแล้ว',
    'cancel_requested': '⏳ รอการอนุมัติยกเลิก'
};

const statusColors = {
    'pending': '#ff9800',
    'processing': '#2196F3',
    'shipped': '#9c27b0',
    'delivered': '#4CAF50',
    'cancelled': '#f44336',
    'cancel_requested': '#ff5722'
};

// ดึง userId จาก localStorage
const userId = localStorage.getItem('userId') || 'guest';

function loadPurchaseHistory() {
    fetch(`/api/purchase-history/${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const historyList = document.getElementById('history-list');
                historyList.innerHTML = '';

                if (!data.history || data.history.length === 0) {
                    historyList.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">ยังไม่มีประวัติการสั่งซื้อ</p>';
                    return;
                }

                data.history.forEach(order => {
                    const card = document.createElement('div');
                    card.className = 'order-card';

                    // สร้างรายการสินค้า
                    let itemsHTML = '';
                    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
                        itemsHTML = order.items.map(item => `
                            <div class="order-item">
                                <span class="item-name">${item.product_name}</span>
                                <span class="item-detail">฿${item.product_price.toLocaleString('th-TH')} x ${item.quantity}</span>
                                <span class="item-total">฿${(item.product_price * item.quantity).toLocaleString('th-TH')}</span>
                            </div>
                        `).join('');
                    } else if (order.product_name) {
                        itemsHTML = `
                            <div class="order-item">
                                <span class="item-name">${order.product_name}</span>
                                <span class="item-detail">฿${order.product_price} x ${order.quantity}</span>
                                <span class="item-total">฿${order.total_price}</span>
                            </div>
                        `;
                    }

                    // ปุ่มยกเลิก (แสดงเฉพาะ pending หรือ processing)
                    let cancelBtnHTML = '';
                    if (['pending', 'processing'].includes(order.status)) {
                        cancelBtnHTML = `<button class="cancel-btn" onclick="requestCancel('${order._id}')">ขอยกเลิกออเดอร์</button>`;
                    } else if (order.status === 'cancel_requested') {
                        cancelBtnHTML = `<span class="cancel-pending-text">⏳ กำลังรอ Admin อนุมัติการยกเลิก...</span>`;
                    }

                    const statusColor = statusColors[order.status] || '#999';
                    const statusLabel = statusLabels[order.status] || order.status;

                    card.innerHTML = `
                        <div class="order-header">
                            <div class="order-id">Order: ${order._id.slice(-5)}</div>
                            <div class="order-status" style="background: ${statusColor};">${statusLabel}</div>
                        </div>

                        <div class="order-items">
                            ${itemsHTML}
                        </div>

                        <div class="order-footer">
                            <div class="order-total">ราคารวม: ฿${order.total_price.toLocaleString('th-TH')}</div>
                            <div class="order-date">สั่งเมื่อ: ${new Date(order.created_at || order.purchase_date).toLocaleString('th-TH')}</div>
                        </div>

                        ${order.shipping_address ? `
                            <div class="order-address">
                                <strong>📍 ที่อยู่จัดส่ง:</strong> ${order.shipping_address}
                            </div>
                        ` : ''}

                        <div class="order-actions">
                            ${cancelBtnHTML}
                        </div>
                    `;

                    historyList.appendChild(card);
                });
            } else {
                document.getElementById('history-list').innerHTML = '<p style="text-align:center;color:red;">ไม่สามารถโหลดประวัติการซื้อได้</p>';
            }
        })
        .catch(err => {
            console.error('ข้อผิดพลาด:', err);
            document.getElementById('history-list').innerHTML = '<p style="text-align:center;color:red;">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
        });
}

// ขอยกเลิก order
function requestCancel(orderId) {
    Swal.fire({
        title: 'ยืนยันการยกเลิก?',
        text: 'คุณต้องการขอยกเลิกออเดอร์นี้หรือไม่? Admin จะเป็นผู้พิจารณาอนุมัติ',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#aaa',
        confirmButtonText: 'ยืนยัน ขอยกเลิก',
        cancelButtonText: 'ไม่ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/api/purchase-history/${orderId}/cancel-request`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    Swal.fire('ส่งคำขอแล้ว!', 'คำขอยกเลิกถูกส่งไปยัง Admin เรียบร้อย', 'success');
                    loadPurchaseHistory();
                } else {
                    Swal.fire('ไม่สำเร็จ', data.error || 'ไม่สามารถยกเลิกได้', 'error');
                }
            })
            .catch(() => Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดในการส่งคำขอ', 'error'));
        }
    });
}

// โหลดข้อมูล
loadPurchaseHistory();
