// ===== LocalStorage Keys =====
const CART_KEY = 'yakebda_cart';
const LAST_ORDER_KEY = 'yakebda_last_order'; // لحفظ الطلب الكامل مع بيانات العميل
const ORDER_TIME_KEY = 'yakebda_order_time';

// ===== Initialize Cart =====
let cart = [];

// Load cart from localStorage with error handling
function loadCart() {
  try {
    const savedCart = localStorage.getItem(CART_KEY);
    if (savedCart) {
      cart = JSON.parse(savedCart);
    }
  } catch (e) {
    console.error('خطأ في قراءة السلة من localStorage:', e);
    cart = [];
    localStorage.removeItem(CART_KEY);
  }

  checkOrderExpiration();
  updateCartCount();

  if (document.getElementById('cartItems')) {
    displayCartItems();
  }
}

// Save cart safely
function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  } catch (e) {
    console.error('خطأ في حفظ السلة:', e);
    showNotification('حدث خطأ أثناء حفظ السلة', 'error');
  }
}

// ===== Add to Cart =====
function addToCart(name, price, image) {
  const existingItem = cart.find((item) => item.name === name);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      name: name,
      price: Number(price),
      image: image,
      quantity: 1,
    });
  }

  saveCart();
  showNotification(`تم إضافة ${name} للسلة ✓`, 'success');
}

// ===== Update Cart Count =====
function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('.cart-count').forEach((el) => {
    el.textContent = totalItems;
  });
}

// ===== Display Cart Items =====
function displayCartItems() {
  const container = document.getElementById('cartItems');
  const empty = document.getElementById('emptyCart');
  const content = document.getElementById('cartContent');

  if (!container) return;

  if (cart.length === 0) {
    empty.style.display = 'block';
    content.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  content.style.display = 'grid';

  container.innerHTML = '';

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;

    const html = `
      <div class="cart-item">
        <input type="hidden" name="products[${index}][name]" value="${item.name}">
        <input type="hidden" name="products[${index}][price]" value="${item.price}">
        <input type="hidden" name="products[${index}][quantity]" value="${item.quantity}">
        <input type="hidden" name="products[${index}][image]" value="${item.image}">

        <div class="cart-item-image">
          <img src="${item.image}" alt="${item.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27%3E%3Crect width=%27120%27 height=%27120%27 fill=%27%23333%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 font-family=%27Arial%27 font-size=%2714%27 fill=%27%23999%27%3E📷%3C/text%3E%3C/svg%3E';">
        </div>
        <div class="cart-item-details">
          <div class="cart-item-header">
            <h3>${item.name}</h3>
            <button type="button" class="btn-remove" onclick="removeFromCart(${index})">حذف</button>
          </div>
          <div class="cart-item-footer">
            <div class="quantity-controls">
              <button type="button" class="qty-btn" onclick="decreaseQuantity(${index})">-</button>
              <span class="quantity">${item.quantity}</span>
              <button type="button" class="qty-btn" onclick="increaseQuantity(${index})">+</button>
            </div>
            <div class="item-price">${itemTotal.toFixed(0)} جنيه</div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML += html;
  });

  updateCartSummary();
}

// ===== Quantity Controls =====
function increaseQuantity(index) {
  cart[index].quantity += 1;
  saveCart();
  displayCartItems();
}

function decreaseQuantity(index) {
  if (cart[index].quantity > 1) {
    cart[index].quantity -= 1;
  } else {
    removeFromCart(index);
    return;
  }
  saveCart();
  displayCartItems();
}

function removeFromCart(index) {
  if (confirm(`متأكد من حذف ${cart[index].name} ؟`)) {
    cart.splice(index, 1);
    saveCart();
    displayCartItems();
  }
}

// ===== Update Summary =====
function updateCartSummary() {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const delivery = subtotal > 0 ? 30 : 0;
  const total = subtotal + delivery;

  const subEl = document.getElementById('subtotal');
  const delEl = document.getElementById('delivery');
  const totEl = document.getElementById('total');

  if (subEl) subEl.textContent = `${subtotal.toFixed(0)} جنيه`;
  if (delEl) delEl.textContent = `${delivery} جنيه`;
  if (totEl) totEl.textContent = `${total.toFixed(0)} جنيه`;
}

// ===== Checkout =====
function checkout(event) {
  // منع الإرسال الافتراضي للفورم
  event.preventDefault();

  if (cart.length === 0) {
    showNotification('السلة فارغة!', 'error');
    return;
  }

  const name = document.getElementById('customerName')?.value.trim();
  const phone = document.getElementById('customerPhone')?.value.trim();
  const address = document.getElementById('customerAddress')?.value.trim();
  const notes =
    document.getElementById('notes')?.value.trim() || 'لا يوجد ملاحظات';

  if (!name) {
    showNotification('من فضلك أدخل الاسم الكامل', 'error');
    document.getElementById('customerName')?.focus();
    return;
  }

  if (!phone) {
    showNotification('من فضلك أدخل رقم التليفون', 'error');
    document.getElementById('customerPhone')?.focus();
    return;
  }

  if (!address) {
    showNotification('من فضلك أدخل العنوان بالتفصيل', 'error');
    document.getElementById('customerAddress')?.focus();
    return;
  }

  if (phone.length !== 11 || !phone.startsWith('01')) {
    showNotification('رقم التليفون يجب أن يكون 11 رقم ويبدأ بـ 01', 'error');
    document.getElementById('customerPhone')?.focus();
    return;
  }

  // ────────────── كل حاجة تمام ──────────────

  // تجهيز بيانات الطلب
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const delivery = 30;
  const total = subtotal + delivery;

  const order = {
    cart: [...cart],
    customer: { name, phone, address, notes },
    subtotal: subtotal,
    delivery: delivery,
    total: total,
    timestamp: Date.now(),
    orderId: 'ORD-' + Date.now().toString().slice(-8),
  };

  // هنا ممكن ترسل البيانات للـ API
  console.log('بيانات الطلب:', order);

  // مثال على إرسال البيانات للـ API
  /*
  fetch('/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(order)
  })
  .then(response => response.json())
  .then(data => {
    console.log('تم إرسال الطلب بنجاح:', data);
  })
  .catch(error => {
    console.error('خطأ في إرسال الطلب:', error);
  });
  */

  // حفظ الطلب محليًا
  localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
  localStorage.setItem(ORDER_TIME_KEY, order.timestamp);

  // عرض مودال النجاح
  const modal = document.getElementById('successModal');
  if (modal) {
    modal.classList.add('show');
  }

  // تنظيف الفورم
  document.getElementById('cartForm')?.reset();

  // حذف السلة بعد 10 ساعات
  setTimeout(clearCart, 36000000);

  // رسالة نجاح
  showNotification('تم إتمام الطلب بنجاح! سيتم التواصل معك قريبًا', 'success');
}

// ===== Close Modal =====
function closeModal() {
  const modal = document.getElementById('successModal');
  if (modal) modal.classList.remove('show');
}

// ===== Clear Cart =====
function clearCart() {
  cart = [];
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(ORDER_TIME_KEY);
  updateCartCount();
  if (document.getElementById('cartItems')) {
    displayCartItems();
  }
  showNotification('تم تفريغ السلة', 'success');
}

// ===== Check Expiration =====
function checkOrderExpiration() {
  const time = localStorage.getItem(ORDER_TIME_KEY);
  if (!time) return;

  const diff = Date.now() - parseInt(time, 10);
  if (diff >= 36000000) {
    clearCart();
    showNotification('تم حذف الطلب القديم تلقائيًا (مرت 10 ساعات)', 'warning');
  }
}

// ===== Show Notification =====
function showNotification(message, type = 'success') {
  document.querySelectorAll('.notification').forEach((el) => el.remove());

  const div = document.createElement('div');
  div.className = 'notification';
  div.textContent = message;

  let background, color, shadowColor;
  if (type === 'error' || type === 'warning') {
    background = 'linear-gradient(135deg, #ff4444, #cc0000)';
    color = '#ffffff';
    shadowColor = 'rgba(255, 68, 68, 0.4)';
  } else {
    background = 'linear-gradient(135deg, #F4C430, #FFC107)';
    color = '#0f0f0f';
    shadowColor = 'rgba(244, 196, 48, 0.35)';
  }

  div.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${background};
    color: ${color};
    padding: 14px 28px;
    border-radius: 50px;
    font-weight: bold;
    font-size: 1rem;
    z-index: 9999;
    box-shadow: 0 6px 25px ${shadowColor};
    animation: slideInRight 0.4s ease;
    direction: rtl;
    text-align: right;
  `;

  document.body.appendChild(div);

  setTimeout(() => {
    div.style.animation = 'slideOutRight 0.4s ease forwards';
    setTimeout(() => div.remove(), 450);
  }, 4000);
}

// ===== Mobile Menu Toggle =====
function toggleMobileMenu() {
  document.getElementById('mobileMenu')?.classList.toggle('show');
}

// ===== Filter Products =====
function filterProducts(category, event) {
  if (!event) return;

  document
    .querySelectorAll('.tab-btn')
    .forEach((btn) => btn.classList.remove('active'));
  event.currentTarget.classList.add('active');

  document.querySelectorAll('.product-card').forEach((card) => {
    card.style.display =
      category === 'all' || card.dataset.category === category
        ? 'block'
        : 'none';
  });
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  setInterval(checkOrderExpiration, 60000);

  document.addEventListener('click', (e) => {
    const modal = document.getElementById('successModal');
    if (modal && e.target === modal) {
      closeModal();
    }
  });
});
