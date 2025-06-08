// Seat Selection JavaScript for Cinema Booking System

document.addEventListener('DOMContentLoaded', function() {
    const seatMap = document.getElementById('seatMap');
    const selectedSeatsDiv = document.getElementById('selectedSeats');
    const totalPriceSpan = document.getElementById('totalPrice');
    const confirmBtn = document.getElementById('confirmBtn');
    const bookingForm = document.getElementById('bookingForm');
    
    let selectedSeats = [];
    let totalPrice = 0;
    
    if (!seatMap) return; // Exit if seat map is not present
    
    // Initialize seat selection
    initializeSeatSelection();
    
    function initializeSeatSelection() {
        // Add click event listeners to all available seats
        const seats = seatMap.querySelectorAll('.seat:not(.booked)');
        
        seats.forEach(seat => {
            seat.addEventListener('click', function() {
                toggleSeat(this);
            });
        });
        
        // Update display initially
        updateSelectedSeatsDisplay();
        updateTotalPrice();
        updateConfirmButton();
    }
    
    function toggleSeat(seatElement) {
        const seatId = seatElement.getAttribute('data-seat');
        const seatPrice = parseFloat(seatElement.getAttribute('data-price'));
        
        if (seatElement.classList.contains('selected')) {
            // Deselect seat
            seatElement.classList.remove('selected');
            selectedSeats = selectedSeats.filter(seat => seat.id !== seatId);
            totalPrice -= seatPrice;
        } else {
            // Select seat (with limit check)
            if (selectedSeats.length >= 8) {
                showAlert('Вы можете выбрать максимум 8 мест за один раз', 'warning');
                return;
            }
            
            seatElement.classList.add('selected');
            selectedSeats.push({
                id: seatId,
                price: seatPrice,
                isVip: seatElement.classList.contains('vip')
            });
            totalPrice += seatPrice;
        }
        
        // Update displays
        updateSelectedSeatsDisplay();
        updateTotalPrice();
        updateConfirmButton();
        
        // Add selection animation
        seatElement.style.animation = 'none';
        setTimeout(() => {
            seatElement.style.animation = 'seatPulse 0.3s ease-out';
        }, 10);
    }
    
    function updateSelectedSeatsDisplay() {
        if (selectedSeats.length === 0) {
            selectedSeatsDiv.innerHTML = '<p class="text-muted mb-0">Выберите места на схеме</p>';
            return;
        }
        
        let html = '<div class="selected-seats-list">';
        html += '<h6 class="mb-2">Выбранные места:</h6>';
        
        selectedSeats.forEach(seat => {
            const vipIcon = seat.isVip ? ' <i class="bi bi-star-fill text-warning"></i>' : '';
            html += `
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span>Место ${seat.id}${vipIcon}</span>
                    <span>${seat.price} ₽</span>
                </div>
            `;
        });
        
        html += '</div>';
        selectedSeatsDiv.innerHTML = html;
        
        // Add hidden inputs for form submission
        updateFormInputs();
    }
    
    function updateFormInputs() {
        // Remove existing seat inputs
        const existingInputs = bookingForm.querySelectorAll('input[name="seats"]');
        existingInputs.forEach(input => input.remove());
        
        // Add new seat inputs
        selectedSeats.forEach(seat => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'seats';
            input.value = seat.id;
            bookingForm.appendChild(input);
        });
    }
    
    function updateTotalPrice() {
        totalPriceSpan.textContent = `${totalPrice} ₽`;
    }
    
    function updateConfirmButton() {
        if (selectedSeats.length > 0) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = `<i class="bi bi-check-circle"></i> Подтвердить (${selectedSeats.length} ${getSeatWord(selectedSeats.length)})`;
        } else {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = 'Выберите места';
        }
    }
    
    function getSeatWord(count) {
        if (count === 1) return 'место';
        if (count >= 2 && count <= 4) return 'места';
        return 'мест';
    }
    
    function showAlert(message, type = 'info') {
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alert.style.cssText = 'top: 100px; right: 20px; z-index: 1050; min-width: 300px;';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Add to page
        document.body.appendChild(alert);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
    
    // Form submission handling
    bookingForm.addEventListener('submit', function(e) {
        if (selectedSeats.length === 0) {
            e.preventDefault();
            showAlert('Пожалуйста, выберите места', 'warning');
            return;
        }
        
        // Add loading state
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Обработка...';
        
        // Re-enable after 10 seconds as fallback
        setTimeout(() => {
            confirmBtn.disabled = false;
            updateConfirmButton();
        }, 10000);
    });
    
    // Keyboard navigation support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Deselect all seats
            const selectedSeatElements = seatMap.querySelectorAll('.seat.selected');
            selectedSeatElements.forEach(seat => {
                seat.classList.remove('selected');
            });
            selectedSeats = [];
            totalPrice = 0;
            updateSelectedSeatsDisplay();
            updateTotalPrice();
            updateConfirmButton();
        }
    });
    
    // Add touch support for mobile devices
    let touchStartX = 0;
    let touchStartY = 0;
    
    seatMap.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    seatMap.addEventListener('touchend', function(e) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        // Check if it's a tap (small movement)
        const deltaX = Math.abs(touchEndX - touchStartX);
        const deltaY = Math.abs(touchEndY - touchStartY);
        
        if (deltaX < 10 && deltaY < 10) {
            const target = document.elementFromPoint(touchEndX, touchEndY);
            if (target && target.classList.contains('seat') && !target.classList.contains('booked')) {
                toggleSeat(target);
            }
        }
    });
    
    // Add visual feedback for hover on desktop
    if (window.matchMedia('(hover: hover)').matches) {
        const seats = seatMap.querySelectorAll('.seat:not(.booked)');
        
        seats.forEach(seat => {
            seat.addEventListener('mouseenter', function() {
                if (!this.classList.contains('selected')) {
                    this.style.transform = 'scale(1.1)';
                }
            });
            
            seat.addEventListener('mouseleave', function() {
                if (!this.classList.contains('selected')) {
                    this.style.transform = '';
                }
            });
        });
    }
});

// Utility function to format price
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
    }).format(price);
}

// Add resize handler for responsive seat map
window.addEventListener('resize', function() {
    // Adjust seat map if needed for different screen sizes
    const seatMap = document.getElementById('seatMap');
    if (seatMap) {
        const containerWidth = seatMap.parentElement.offsetWidth;
        if (containerWidth < 600) {
            seatMap.classList.add('compact');
        } else {
            seatMap.classList.remove('compact');
        }
    }
});
