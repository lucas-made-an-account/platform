document.addEventListener('DOMContentLoaded', function() {
    // 全局数据存储
    const appData = {
        dishes: [],
        setupCompleted: false, // Track if setup is completed
        settings: {
            orderTime: {
                days: [true, true, true, true, true, false, false], // 周一到周日
                startTime: "08:00",
                endTime: "11:00"
            },
            cookingTime: {
                days: [true, true, true, true, true, false, false],
                startTime: "13:00",
                endTime: "17:00"
            },
            pickupRule: "sameDay", // sameDay 或 nextDay
            delivery: {
                homeDelivery: true,
                range: 5,
                fee: 5,
                fixedPickup: true,
                location: "XX学校门口",
                pickupStartTime: "14:30",
                pickupEndTime: "15:00"
            }
        },
        kitchenInfo: {
            photos: [],
            introduction: "",
            wechatQR: "",
            phone: ""
        },
        reviews: [],
        profile: {
            avatar: "",
            nickname: "",
            address: "",
            wechat: "",
            phone: "",
            idCard: {
                front: "",
                back: ""
            },
            location: {
                lat: 0,
                lng: 0,
                address: ""
            },
            kitchenPhotos: [],
            stats: {
                totalDishes: 0,
                totalOrders: 0,
                averageRating: 0
            }
        }
    };

    // Setup wizard state
    let currentSetupStep = 0;
    const setupSteps = [
        { id: 'profile', name: '个人资料', required: true },
        { id: 'kitchen', name: '厨房信息', required: true },
        { id: 'orders', name: '接单设置', required: true }
    ];

    // Check if setup is completed
    function isSetupCompleted() {
        const savedData = localStorage.getItem('appData');
        if (savedData) {
            const data = JSON.parse(savedData);
            return data.setupCompleted === true;
        }
        return false;
    }

    // Check if current step is completed
    function isStepCompleted(stepId) {
        switch(stepId) {
            case 'profile':
                return appData.profile.address && 
                       appData.profile.wechat && 
                       appData.profile.phone;
            case 'kitchen':
                return appData.kitchenInfo.photos.length > 0 && 
                       appData.kitchenInfo.introduction && 
                       appData.kitchenInfo.wechatQR && 
                       appData.kitchenInfo.phone;
            case 'orders':
                return true; // Orders settings have defaults, so always considered complete
            default:
                return false;
        }
    }

    // Show setup wizard
    function showSetupWizard() {
        // Hide all main pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Hide bottom navigation
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            bottomNav.style.display = 'none';
        }
        
        // Create setup wizard overlay
        const setupOverlay = document.createElement('div');
        setupOverlay.id = 'setup-wizard';
        setupOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: white; z-index: 2000; overflow-y: auto;
            padding: 20px;
        `;
        
        setupOverlay.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #ff6b6b; margin-bottom: 10px;">欢迎加入家厨平台！</h1>
                    <p style="color: #666; font-size: 16px;">请完成以下设置步骤，开始您的厨师之旅</p>
                </div>
                
                <div id="setup-progress" style="margin-bottom: 30px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        ${setupSteps.map((step, index) => `
                            <div class="setup-step ${index === currentSetupStep ? 'active' : ''} ${isStepCompleted(step.id) ? 'completed' : ''}" 
                                 style="flex: 1; text-align: center; padding: 10px; margin: 0 5px; border-radius: 8px; 
                                        background: ${index === currentSetupStep ? '#ff6b6b' : isStepCompleted(step.id) ? '#52c41a' : '#f0f0f0'};
                                        color: ${index === currentSetupStep || isStepCompleted(step.id) ? 'white' : '#666'};">
                                <div style="font-weight: bold;">${index + 1}</div>
                                <div style="font-size: 12px;">${step.name}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div style="background: #f0f0f0; height: 4px; border-radius: 2px;">
                        <div style="background: #ff6b6b; height: 100%; border-radius: 2px; width: ${(currentSetupStep / setupSteps.length) * 100}%; transition: width 0.3s;"></div>
                    </div>
                </div>
                
                <div id="setup-content">
                    ${getSetupStepContent(currentSetupStep)}
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-top: 30px;">
                    <button id="setup-prev" style="padding: 12px 24px; background: #f0f0f0; color: #666; border: none; border-radius: 6px; cursor: pointer;" 
                            ${currentSetupStep === 0 ? 'disabled' : ''}>上一步</button>
                    <button id="setup-next" style="padding: 12px 24px; background: #ff6b6b; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        ${currentSetupStep === setupSteps.length - 1 ? '完成设置' : '下一步'}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(setupOverlay);
        
        // Add event listeners
        document.getElementById('setup-prev').onclick = () => {
            if (currentSetupStep > 0) {
                currentSetupStep--;
                updateSetupWizard();
            }
        };
        
        document.getElementById('setup-next').onclick = () => {
            if (validateCurrentStep()) {
                if (currentSetupStep === setupSteps.length - 1) {
                    completeSetup();
                } else {
                    currentSetupStep++;
                    updateSetupWizard();
                }
            }
        };
    }

    // Get content for current setup step
    function getSetupStepContent(stepIndex) {
        const step = setupSteps[stepIndex];
        
        switch(step.id) {
            case 'profile':
                return `
                    <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <h3 style="margin-bottom: 20px; color: #333;">完善个人资料</h3>
                        <form id="setup-profile-form">
                            <div style="margin-bottom: 16px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 500;">家庭地址 *</label>
                                <div style="border: 1px solid #ddd; border-radius: 6px; overflow: hidden;">
                                    <div id="setup-map" style="height: 200px; width: 100%; position: relative; z-index: 1;"></div>
                                    <div style="padding: 12px; background: #f8f9fa; border-top: 1px solid #eee;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <span id="setup-address-display" style="color: #666; font-size: 14px;">点击下方按钮选择地址</span>
                                            <button type="button" id="setup-update-address" style="padding: 6px 12px; background: #ff6b6b; color: white; border: none; border-radius: 4px; font-size: 12px;">更新地址</button>
                                        </div>
                                    </div>
                                </div>
                                <input type="hidden" id="setup-address" required>
                            </div>
                            <div style="margin-bottom: 16px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 500;">微信号 *</label>
                                <input type="text" id="setup-wechat" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px;" placeholder="请输入您的微信号" required>
                            </div>
                            <div style="margin-bottom: 16px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 500;">电话号码 *</label>
                                <input type="tel" id="setup-phone" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px;" placeholder="请输入您的电话号码" required>
                            </div>
                        </form>
                    </div>
                `;
            case 'kitchen':
                return `
                    <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <h3 style="margin-bottom: 20px; color: #333;">厨房信息设置</h3>
                        <form id="setup-kitchen-form">
                            <div style="margin-bottom: 16px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 500;">个人简介 *</label>
                                <textarea id="setup-kitchen-intro" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; min-height: 100px;" placeholder="请介绍您的厨艺背景和特色..." required></textarea>
                            </div>
                            <div style="margin-bottom: 16px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 500;">厨房照片 *</label>
                                <div id="setup-photo-upload" style="border: 2px dashed #ddd; padding: 40px; text-align: center; border-radius: 8px; cursor: pointer;">
                                    <i class="bi bi-cloud-upload" style="font-size: 48px; color: #ccc; display: block; margin-bottom: 10px;"></i>
                                    <p style="color: #666; margin: 0;">点击上传厨房照片</p>
                                    <input type="file" id="setup-kitchen-photos" accept="image/*" multiple style="display: none;">
                                </div>
                                <div id="setup-photos-preview" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;"></div>
                            </div>
                            <div style="margin-bottom: 16px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 500;">微信二维码 *</label>
                                <div id="setup-qr-upload" style="border: 2px dashed #ddd; padding: 20px; text-align: center; border-radius: 8px; cursor: pointer;">
                                    <p style="color: #666; margin: 0;">点击上传微信二维码</p>
                                    <input type="file" id="setup-wechat-qr" accept="image/*" style="display: none;">
                                </div>
                                <div id="setup-qr-preview" style="margin-top: 10px;"></div>
                            </div>
                            <div style="margin-bottom: 16px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 500;">联系电话 *</label>
                                <input type="tel" id="setup-kitchen-phone" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px;" placeholder="请输入联系电话" required>
                            </div>
                        </form>
                    </div>
                `;
            case 'orders':
                return `
                    <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <h3 style="margin-bottom: 20px; color: #333;">接单设置</h3>
                        <p style="color: #666; margin-bottom: 20px;">系统已为您设置了默认的接单时间和配送选项，您可以稍后在设置中修改。</p>
                        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                            <h4 style="margin: 0 0 8px 0; color: #333;">默认设置：</h4>
                            <ul style="margin: 0; padding-left: 20px; color: #666;">
                                <li>接单时间：周一至周五 08:00-11:00</li>
                                <li>出菜时间：周一至周五 13:00-17:00</li>
                                <li>支持家庭配送（5公里内，配送费¥5）</li>
                                <li>支持固定地点取餐</li>
                            </ul>
                        </div>
                        <p style="color: #52c41a; font-weight: 500; text-align: center;">✓ 接单设置已完成</p>
                    </div>
                `;
            default:
                return '';
        }
    }

    // Update setup wizard display
    function updateSetupWizard() {
        // Clean up existing map if it exists
        if (window.setupMap) {
            window.setupMap.remove();
            window.setupMap = null;
            window.setupMarker = null;
        }
        
        const setupOverlay = document.getElementById('setup-wizard');
        if (setupOverlay) {
            setupOverlay.innerHTML = `
                <div style="max-width: 600px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #ff6b6b; margin-bottom: 10px;">欢迎加入家厨平台！</h1>
                        <p style="color: #666; font-size: 16px;">请完成以下设置步骤，开始您的厨师之旅</p>
                    </div>
                    
                    <div id="setup-progress" style="margin-bottom: 30px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            ${setupSteps.map((step, index) => `
                                <div class="setup-step ${index === currentSetupStep ? 'active' : ''} ${isStepCompleted(step.id) ? 'completed' : ''}" 
                                     style="flex: 1; text-align: center; padding: 10px; margin: 0 5px; border-radius: 8px; 
                                            background: ${index === currentSetupStep ? '#ff6b6b' : isStepCompleted(step.id) ? '#52c41a' : '#f0f0f0'};
                                            color: ${index === currentSetupStep || isStepCompleted(step.id) ? 'white' : '#666'};">
                                    <div style="font-weight: bold;">${index + 1}</div>
                                    <div style="font-size: 12px;">${step.name}</div>
                                </div>
                            `).join('')}
                        </div>
                        <div style="background: #f0f0f0; height: 4px; border-radius: 2px;">
                            <div style="background: #ff6b6b; height: 100%; border-radius: 2px; width: ${(currentSetupStep / setupSteps.length) * 100}%; transition: width 0.3s;"></div>
                        </div>
                    </div>
                    
                    <div id="setup-content">
                        ${getSetupStepContent(currentSetupStep)}
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-top: 30px;">
                        <button id="setup-prev" style="padding: 12px 24px; background: #f0f0f0; color: #666; border: none; border-radius: 6px; cursor: pointer;" 
                                ${currentSetupStep === 0 ? 'disabled' : ''}>上一步</button>
                        <button id="setup-next" style="padding: 12px 24px; background: #ff6b6b; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            ${currentSetupStep === setupSteps.length - 1 ? '完成设置' : '下一步'}
                        </button>
                    </div>
                </div>
            `;
            
            // Re-add event listeners
            document.getElementById('setup-prev').onclick = () => {
                if (currentSetupStep > 0) {
                    currentSetupStep--;
                    updateSetupWizard();
                }
            };
            
            document.getElementById('setup-next').onclick = () => {
                if (validateCurrentStep()) {
                    if (currentSetupStep === setupSteps.length - 1) {
                        completeSetup();
                    } else {
                        currentSetupStep++;
                        updateSetupWizard();
                    }
                }
            };
            
            // Add step-specific event listeners
            addStepEventListeners();
        }
    }

    // Add event listeners for current step
    function addStepEventListeners() {
        const currentStep = setupSteps[currentSetupStep];
        
        if (currentStep.id === 'profile') {
            // Initialize map with more robust error handling
            setTimeout(() => {
                const mapElement = document.getElementById('setup-map');
                console.log('Map element found:', mapElement);
                console.log('Leaflet available:', typeof L !== 'undefined');
                
                if (mapElement && !window.setupMap) {
                    // Check if Leaflet is available
                    if (typeof L === 'undefined') {
                        console.error('Leaflet is not loaded yet, retrying...');
                        setTimeout(() => addStepEventListeners(), 1000);
                        return;
                    }
                    
                    try {
                        // Clear any existing content
                        mapElement.innerHTML = '';
                        
                        // Ensure the map container has proper dimensions
                        mapElement.style.height = '200px';
                        mapElement.style.width = '100%';
                        mapElement.style.background = '#f0f0f0';
                        mapElement.style.border = '1px solid #ccc';
                        
                        console.log('Creating map...');
                        
                        // Create map with simpler configuration
                        window.setupMap = L.map(mapElement, {
                            center: [39.9042, 116.4074],
                            zoom: 10,
                            zoomControl: true,
                            attributionControl: false
                        });
                        
                        console.log('Map created, adding tiles...');
                        
                        // Add OpenStreetMap tiles with error handling
                        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '© OpenStreetMap',
                            maxZoom: 18,
                            timeout: 10000
                        });
                        
                        tileLayer.on('tileerror', function(error) {
                            console.error('Tile loading error:', error);
                            // Try alternative tile server
                            console.log('Trying alternative tile server...');
                            const fallbackLayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
                                attribution: '© CartoDB',
                                maxZoom: 18
                            });
                            fallbackLayer.addTo(window.setupMap);
                        });
                        
                        tileLayer.on('tileload', function() {
                            console.log('Tile loaded successfully');
                        });
                        
                        tileLayer.addTo(window.setupMap);
                        
                        // Add marker
                        window.setupMarker = L.marker([39.9042, 116.4074])
                            .addTo(window.setupMap)
                            .bindPopup('当前位置');
                        
                        // Force map to resize properly with multiple attempts
                        setTimeout(() => {
                            if (window.setupMap) {
                                console.log('Invalidating map size...');
                                window.setupMap.invalidateSize();
                                window.setupMap.setView([39.9042, 116.4074], 10);
                            }
                        }, 200);
                        
                        setTimeout(() => {
                            if (window.setupMap) {
                                window.setupMap.invalidateSize();
                            }
                        }, 500);
                        
                        console.log('Setup map initialized successfully');
                    } catch (error) {
                        console.error('Error initializing setup map:', error);
                        // Fallback: show a simple message
                        mapElement.innerHTML = `
                            <div style="height: 200px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; color: #666; border: 1px solid #ddd;">
                                <div style="text-align: center;">
                                    <i class="bi bi-geo-alt" style="font-size: 24px; margin-bottom: 8px;"></i><br>
                                    地图加载失败<br>
                                    <small>请点击下方按钮获取位置</small>
                                </div>
                            </div>
                        `;
                    }
                }
                
                // Update address button
                const updateAddressBtn = document.getElementById('setup-update-address');
                if (updateAddressBtn) {
                    updateAddressBtn.onclick = () => {
                        if (navigator.geolocation) {
                            updateAddressBtn.textContent = '定位中...';
                            updateAddressBtn.disabled = true;
                            
                            navigator.geolocation.getCurrentPosition(
                                (position) => {
                                    const pos = {
                                        lat: position.coords.latitude,
                                        lng: position.coords.longitude
                                    };
                                    
                                    console.log('Got position:', pos);
                                    
                                    // Update map if available
                                    if (window.setupMap && window.setupMarker) {
                                        window.setupMap.setView([pos.lat, pos.lng], 15);
                                        window.setupMarker.setLatLng([pos.lat, pos.lng]);
                                        window.setupMap.invalidateSize();
                                    }
                                    
                                    // Reverse geocoding to get address
                                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&zoom=18&addressdetails=1`)
                                        .then(response => response.json())
                                        .then(data => {
                                            const address = data.display_name || `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
                                            document.getElementById('setup-address-display').textContent = address;
                                            document.getElementById('setup-address').value = address;
                                            
                                            // Save location to app data
                                            appData.profile.location = pos;
                                            appData.profile.address = address;
                                            
                                            updateAddressBtn.textContent = '更新地址';
                                            updateAddressBtn.disabled = false;
                                            
                                            console.log('Address updated:', address);
                                        })
                                        .catch(error => {
                                            console.error('Geocoding error:', error);
                                            const address = `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
                                            document.getElementById('setup-address-display').textContent = address;
                                            document.getElementById('setup-address').value = address;
                                            
                                            appData.profile.location = pos;
                                            appData.profile.address = address;
                                            
                                            updateAddressBtn.textContent = '更新地址';
                                            updateAddressBtn.disabled = false;
                                        });
                                },
                                (error) => {
                                    console.error('Geolocation error:', error);
                                    alert('无法获取位置信息，请检查位置权限设置');
                                    updateAddressBtn.textContent = '更新地址';
                                    updateAddressBtn.disabled = false;
                                }
                            );
                        } else {
                            alert('您的浏览器不支持地理定位');
                        }
                    };
                }
            }, 1000); // Increased timeout further
        } else if (currentStep.id === 'kitchen') {
            // Kitchen photo upload
            const photoUpload = document.getElementById('setup-photo-upload');
            const photoInput = document.getElementById('setup-kitchen-photos');
            
            if (photoUpload && photoInput) {
                photoUpload.onclick = () => photoInput.click();
                photoInput.onchange = (e) => {
                    const files = Array.from(e.target.files);
                    const preview = document.getElementById('setup-photos-preview');
                    preview.innerHTML = '';
                    
                    files.forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const img = document.createElement('img');
                            img.src = e.target.result;
                            img.style.cssText = 'width: 80px; height: 80px; object-fit: cover; border-radius: 6px;';
                            preview.appendChild(img);
                        };
                        reader.readAsDataURL(file);
                    });
                };
            }
            
            // QR code upload
            const qrUpload = document.getElementById('setup-qr-upload');
            const qrInput = document.getElementById('setup-wechat-qr');
            
            if (qrUpload && qrInput) {
                qrUpload.onclick = () => qrInput.click();
                qrInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const preview = document.getElementById('setup-qr-preview');
                            preview.innerHTML = `<img src="${e.target.result}" style="width: 150px; height: 150px; object-fit: cover; border-radius: 6px;">`;
                        };
                        reader.readAsDataURL(file);
                    }
                };
            }
        }
    }

    // Validate current step
    function validateCurrentStep() {
        const currentStep = setupSteps[currentSetupStep];
        
        switch(currentStep.id) {
            case 'profile':
                const address = document.getElementById('setup-address').value.trim();
                const wechat = document.getElementById('setup-wechat').value.trim();
                const phone = document.getElementById('setup-phone').value.trim();
                
                if (!address || !wechat || !phone) {
                    alert('请填写所有必填字段');
                    return false;
                }
                
                // Save profile data
                appData.profile.address = address;
                appData.profile.wechat = wechat;
                appData.profile.phone = phone;
                break;
                
            case 'kitchen':
                const intro = document.getElementById('setup-kitchen-intro').value.trim();
                const photos = document.getElementById('setup-kitchen-photos').files;
                const qr = document.getElementById('setup-wechat-qr').files[0];
                const kitchenPhone = document.getElementById('setup-kitchen-phone').value.trim();
                
                if (!intro || photos.length === 0 || !qr || !kitchenPhone) {
                    alert('请完成所有厨房信息设置');
                    return false;
                }
                
                // Save kitchen data
                appData.kitchenInfo.introduction = intro;
                appData.kitchenInfo.phone = kitchenPhone;
                
                // Process photos
                const photoPromises = Array.from(photos).map(file => {
                    return new Promise(resolve => {
                        const reader = new FileReader();
                        reader.onload = e => resolve(e.target.result);
                        reader.readAsDataURL(file);
                    });
                });
                
                // Process QR code
                const qrPromise = new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = e => resolve(e.target.result);
                    reader.readAsDataURL(qr);
                });
                
                // Wait for all files to be processed
                Promise.all([...photoPromises, qrPromise]).then(results => {
                    appData.kitchenInfo.photos = results.slice(0, -1);
                    appData.kitchenInfo.wechatQR = results[results.length - 1];
                });
                break;
                
            case 'orders':
                // Orders step is always valid (uses defaults)
                break;
        }
        
        return true;
    }

    // Complete setup process
    function completeSetup() {
        appData.setupCompleted = true;
        localStorage.setItem('appData', JSON.stringify(appData));
        
        // Remove setup wizard
        const setupOverlay = document.getElementById('setup-wizard');
        if (setupOverlay) {
            setupOverlay.remove();
        }
        
        // Show bottom navigation
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            bottomNav.style.display = '';
        }
        
        // Show main page
        document.getElementById('main-page').classList.add('active');
        
        // Show success message
        showToast('设置完成！欢迎加入家厨平台！', 'success');
        
        // Initialize the main app
        initPage();
    }

    // 全局变量
    let isBatchMode = false;
    let selectedDishes = new Set();

    // DOM 元素
    const dishesContainer = document.getElementById('dishes-container');
    const batchModeBtn = document.getElementById('batch-mode-btn');
    const batchActions = document.querySelector('.batch-actions');
    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    const cancelBatchBtn = document.getElementById('cancel-batch-btn');
    const addDishBtn = document.getElementById('add-dish-btn');
    const dishModal = new bootstrap.Modal(document.getElementById('dish-modal'));
    const dishForm = document.getElementById('dish-form');
    const saveDishBtn = document.getElementById('save-dish-btn');

    // 导航切换
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-page');
            
            // 更新导航状态
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // 更新页面显示
            pages.forEach(page => {
                page.classList.remove('active');
                if (page.id === `${targetPage}-page`) {
                    page.classList.add('active');
                }
            });
        });
    });

    // 添加新菜按钮点击事件
    if (addDishBtn) {
        addDishBtn.addEventListener('click', function() {
            showDishModal();
        });
    }

    // 添加第一个菜品按钮点击事件
    const addFirstDishBtn = document.getElementById('add-first-dish');
    if (addFirstDishBtn) {
        addFirstDishBtn.addEventListener('click', function() {
            showDishModal();
        });
    }

    // 批量管理按钮点击事件
    const batchManageBtn = document.getElementById('batch-manage');
    if (batchManageBtn) {
        batchManageBtn.addEventListener('click', function() {
            toggleBatchMode();
        });
    }

    // 设置事件监听器
    function setupEventListeners() {
        // 批量模式按钮
        batchModeBtn.addEventListener('click', toggleBatchMode);

        // 取消批量模式
        cancelBatchBtn.addEventListener('click', () => {
            isBatchMode = false;
            selectedDishes.clear();
            updateBatchModeUI();
        });

        // 删除选中按钮
        deleteSelectedBtn.addEventListener('click', deleteSelectedDishes);

        // 保存菜品按钮
        saveDishBtn.addEventListener('click', saveDish);

        // 图片上传按钮
        const uploadPhotoBtn = document.getElementById('upload-photo-btn');
        const takePhotoBtn = document.getElementById('take-photo-btn');
        const imageInput = document.getElementById('dish-image-input');

        if (uploadPhotoBtn && takePhotoBtn && imageInput) {
            uploadPhotoBtn.addEventListener('click', () => {
                imageInput.removeAttribute('capture');
                imageInput.click();
            });

            takePhotoBtn.addEventListener('click', () => {
                imageInput.setAttribute('capture', 'environment');
                imageInput.click();
            });

            imageInput.addEventListener('change', handleImageSelect);
        }

        // 图片上传容器点击事件
        const imageUploadContainer = document.getElementById('dish-images-upload');
        const imageInputUpload = document.getElementById('dish-images-input');
        
        imageUploadContainer.addEventListener('click', () => {
            imageInputUpload.click();
        });

        // 拖拽上传
        imageUploadContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            imageUploadContainer.classList.add('dragover');
        });

        imageUploadContainer.addEventListener('dragleave', () => {
            imageUploadContainer.classList.remove('dragover');
        });

        imageUploadContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            imageUploadContainer.classList.remove('dragover');
            const files = e.dataTransfer.files;
            handleImageFiles(files);
        });

        // 文件选择事件
        imageInputUpload.addEventListener('change', (e) => {
            handleImageFiles(e.target.files);
        });

        // 取餐时间按钮点击事件
        const timeButtons = document.querySelectorAll('.time-btn');
        timeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                timeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const customTimeInput = document.querySelector('.custom-time-input');
                if (btn.dataset.time === 'custom') {
                    customTimeInput.style.display = 'block';
                } else {
                    customTimeInput.style.display = 'none';
                }
            });
        });
    }

    // 切换批量模式
    function toggleBatchMode() {
        isBatchMode = !isBatchMode;
        if (!isBatchMode) {
            selectedDishes.clear();
        }
        updateBatchModeUI();
    }

    // 更新批量模式 UI
    function updateBatchModeUI() {
        batchModeBtn.classList.toggle('active', isBatchMode);
        batchActions.style.display = isBatchMode ? 'flex' : 'none';
        document.querySelectorAll('.dish-card').forEach(card => {
            card.classList.toggle('batch-mode', isBatchMode);
            card.classList.toggle('selected', false);
        });
    }

    // 处理批量选择
    function handleBatchSelection(e, index) {
        // 如果点击的是按钮，不处理选择
        if (e.target.closest('.dish-actions')) {
            return;
        }

        if (selectedDishes.has(index)) {
            selectedDishes.delete(index);
        } else {
            selectedDishes.add(index);
        }

        const card = e.currentTarget;
        card.classList.toggle('selected', selectedDishes.has(index));
    }

    // 删除选中的菜品
    function deleteSelectedDishes() {
        if (selectedDishes.size === 0) {
            return;
        }

        if (confirm('确定要删除选中的菜品吗？')) {
            // Get dishes to delete before removing them
            const dishesToDelete = [];
            selectedDishes.forEach(index => {
                dishesToDelete.push(appData.dishes[index].id);
            });
            
            const sortedIndexes = Array.from(selectedDishes).sort((a, b) => b - a);
            sortedIndexes.forEach(index => {
                const dishToDelete = appData.dishes[index];
                appData.dishes.splice(index, 1);
            });

            // Also remove from consumer dishes storage
            const existingDishes = JSON.parse(localStorage.getItem('dishes') || '[]');
            const updatedDishes = existingDishes.filter(d => !dishesToDelete.includes(d.id));
            localStorage.setItem('dishes', JSON.stringify(updatedDishes));

            selectedDishes.clear();
            saveDishes();
            renderDishes();
            isBatchMode = false;
            updateBatchModeUI();
        }
    }

    // 处理图片选择
    function handleImageSelect(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('dish-image-preview');
                preview.src = e.target.result;
                preview.style.display = 'block';
                // 清除图片验证错误
                document.querySelector('.image-upload-container').classList.remove('is-invalid');
            };
            reader.readAsDataURL(file);
        }
    }

    // 显示菜品模态框
    function showDishModal(dish = null) {
        const modalTitle = document.getElementById('dish-modal-title');
        modalTitle.textContent = dish ? '编辑菜品' : '添加菜品';

        // 重置表单
        dishForm.reset();
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

        if (dish) {
            // 填充表单数据
            document.getElementById('dish-name').value = dish.name;
            document.getElementById('dish-price').value = dish.price;
            document.getElementById('dish-description').value = dish.description || '';
            document.getElementById('same-day-pickup').checked = dish.sameDayPickup || false;
            document.getElementById('dish-status').checked = dish.status !== false;
            
            // 显示已有图片
            const imagePreviewContainer = document.getElementById('dish-images-preview');
            imagePreviewContainer.innerHTML = '';
            dish.images.forEach(image => {
                const img = document.createElement('img');
                img.src = image;
                img.className = 'dish-preview-image';
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '<i class="bi bi-x"></i>';
                removeBtn.onclick = () => img.remove();
                img.appendChild(removeBtn);
                imagePreviewContainer.appendChild(img);
            });

            // 设置取餐时间
            if (dish.pickupTime) {
                const timeButtons = document.querySelectorAll('.time-btn');
                timeButtons.forEach(btn => {
                    if (btn.dataset.time === dish.pickupTime.type) {
                        btn.classList.add('active');
                        if (dish.pickupTime.type === 'custom') {
                            document.querySelector('.custom-time-input').style.display = 'block';
                            document.getElementById('custom-start-time').value = dish.pickupTime.start;
                            document.getElementById('custom-end-time').value = dish.pickupTime.end;
                        }
                    }
                });
            }

            // 设置编辑模式
            dishForm.dataset.editingIndex = appData.dishes.findIndex(d => d.id === dish.id);
        } else {
            // 重置图片预览
            const imagePreviewContainer = document.getElementById('dish-images-preview');
            imagePreviewContainer.innerHTML = '';
            // 清除编辑模式
            delete dishForm.dataset.editingIndex;
        }

        dishModal.show();
    }

    // 保存菜品
    function saveDish() {
        const formData = new FormData(document.getElementById('dish-form'));
        const images = document.getElementById('dish-images-input').files;
        
        handleMultipleImages(images).then(imageUrls => {
            // Get selected pickup time
            const activeTimeBtn = document.querySelector('.time-btn.active');
            let pickupTime = null;
            
            if (activeTimeBtn) {
                const timeType = activeTimeBtn.dataset.time;
                if (timeType === 'lunch') {
                    pickupTime = {
                        type: 'lunch',
                        start: '11:30',
                        end: '13:00'
                    };
                } else if (timeType === 'dinner') {
                    pickupTime = {
                        type: 'dinner',
                        start: '17:30',
                        end: '19:00'
                    };
                } else if (timeType === 'custom') {
                    pickupTime = {
                        type: 'custom',
                        start: document.getElementById('custom-start-time').value,
                        end: document.getElementById('custom-end-time').value
                    };
                }
            }

            const dish = {
                id: Date.now().toString(),
                name: formData.get('name'),
                price: parseFloat(formData.get('price')),
                description: formData.get('description'),
                images: imageUrls,
                pickupTime: pickupTime,
                sameDayPickup: formData.get('sameDayPickup') === 'on',
                status: formData.get('status') === 'on',
                createdAt: new Date().toISOString()
            };

            if (dishForm.dataset.editingIndex) {
                appData.dishes[dishForm.dataset.editingIndex] = dish;
            } else {
                appData.dishes.push(dish);
            }

            // Save to localStorage
            localStorage.setItem('appData', JSON.stringify(appData));
            
            // Also save dishes to the shared 'dishes' key for consumer app
            const cookUser = JSON.parse(localStorage.getItem('cookUser') || '{}');
            const consumerDish = {
                id: dish.id,
                name: dish.name,
                description: dish.description,
                price: dish.price,
                image: dish.images[0] || 'https://via.placeholder.com/300x200?text=No+Image',
                cook: cookUser.displayName || cookUser.username || '厨师',
                rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0 for new dishes
                category: '家常菜', // Default category, could be made configurable
                available: dish.status,
                createdAt: dish.createdAt,
                pickupTime: dish.pickupTime,
                sameDayPickup: dish.sameDayPickup
            };
            
            // Get existing dishes from consumer storage
            const existingDishes = JSON.parse(localStorage.getItem('dishes') || '[]');
            
            // Update if editing, add if new
            if (dishForm.dataset.editingIndex) {
                const dishIndex = existingDishes.findIndex(d => d.id === dish.id);
                if (dishIndex !== -1) {
                    existingDishes[dishIndex] = consumerDish;
                }
            } else {
                existingDishes.push(consumerDish);
            }
            
            // Save back to dishes storage
            localStorage.setItem('dishes', JSON.stringify(existingDishes));
            
            // Update UI
            renderDishes();
            dishModal.hide();
            showToast('菜品保存成功');
            
            // Update stats
            updateProfileStats();
            
            // Go back to main page
            goToMainPage();
        });
    }

    // 保存菜品数据到本地存储
    function saveDishes() {
        localStorage.setItem('dishes', JSON.stringify(appData.dishes));
    }

    // 渲染菜品列表
    function renderDishes() {
        dishesContainer.innerHTML = '';
        if (appData.dishes.length === 0) {
            showEmptyState();
        } else {
            appData.dishes.forEach((dish, index) => {
                const dishCard = createDishCard(dish, index);
                dishesContainer.appendChild(dishCard);
            });
        }
    }

    // 创建菜品卡片
    function createDishCard(dish, index) {
        const card = document.createElement('div');
        card.className = 'dish-card';
        if (isBatchMode) {
            card.classList.add('batch-mode');
        }
        if (selectedDishes.has(index)) {
            card.classList.add('selected');
        }

        card.innerHTML = `
            <div class="dish-image">
                <img src="${dish.images[0] || 'placeholder-dish.png'}" alt="${dish.name}">
            </div>
            <div class="dish-info">
                <h3>${dish.name}</h3>
                <p class="price">¥${dish.price.toFixed(2)}</p>
                <p class="description">${dish.description || ''}</p>
            </div>
            <div class="dish-actions">
                <button class="btn btn-sm btn-outline-primary edit-btn" data-index="${index}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-index="${index}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;

        // 添加事件监听器
        card.addEventListener('click', (e) => {
            if (isBatchMode) {
                handleBatchSelection(e, index);
            }
        });

        // 添加删除按钮事件监听器
        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('确定要删除这个菜品吗？')) {
                const dishToDelete = appData.dishes[index];
                appData.dishes.splice(index, 1);
                saveDishes();
                
                // Also remove from consumer dishes storage
                const existingDishes = JSON.parse(localStorage.getItem('dishes') || '[]');
                const updatedDishes = existingDishes.filter(d => d.id !== dishToDelete.id);
                localStorage.setItem('dishes', JSON.stringify(updatedDishes));
                
                renderDishes();
            }
        });

        // 添加编辑按钮事件监听器
        const editBtn = card.querySelector('.edit-btn');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showDishModal(appData.dishes[index]);
        });

        return card;
    }

    // 显示空白状态
    function showEmptyState() {
        dishesContainer.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-egg-fried"></i>
                <p>还没有添加菜品</p>
                <button class="btn btn-primary" id="add-first-dish">
                    <i class="bi bi-plus"></i> 添加第一个菜品
                </button>
            </div>
        `;

        document.getElementById('add-first-dish').addEventListener('click', () => {
            showDishModal();
        });
    }

    // 接单设置页面 - 日期选择
    const dayItems = document.querySelectorAll('.day-item');
    dayItems.forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });

    // 接单设置页面 - 配送选项显示/隐藏
    const homeDeliveryCheckbox = document.getElementById('homeDelivery');
    const homeDeliveryOptions = document.getElementById('homeDeliveryOptions');
    const fixedPickupCheckbox = document.getElementById('fixedPickup');
    const fixedPickupOptions = document.getElementById('fixedPickupOptions');

    if (homeDeliveryCheckbox && homeDeliveryOptions) {
        homeDeliveryCheckbox.addEventListener('change', function() {
            homeDeliveryOptions.style.display = this.checked ? 'block' : 'none';
        });
    }

    if (fixedPickupCheckbox && fixedPickupOptions) {
        fixedPickupCheckbox.addEventListener('change', function() {
            fixedPickupOptions.style.display = this.checked ? 'block' : 'none';
        });
    }

    // 厨房信息页面 - 添加照片
    const addPhotoBtn = document.querySelector('.add-photo');
    if (addPhotoBtn) {
        addPhotoBtn.addEventListener('click', function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;
            
            input.onchange = function(e) {
                const files = Array.from(e.target.files);
                files.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const photoGrid = document.querySelector('.photo-grid');
                        const photoItem = document.createElement('div');
                        photoItem.className = 'photo-item';
                        photoItem.innerHTML = `
                            <img src="${e.target.result}" alt="厨房照片">
                            <button class="delete-photo"><i class="bi bi-x-lg"></i></button>
                        `;
                        
                        photoGrid.insertBefore(photoItem, document.querySelector('.add-photo'));
                        
                        // Save to appData
                        if (!appData.kitchenInfo) appData.kitchenInfo = {};
                        if (!appData.kitchenInfo.photos) appData.kitchenInfo.photos = [];
                        appData.kitchenInfo.photos.push(e.target.result);
                        localStorage.setItem('appData', JSON.stringify(appData));
                        
                        // Bind delete button
                        const deleteBtn = photoItem.querySelector('.delete-photo');
                        deleteBtn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            if (confirm('确定要删除这张照片吗？')) {
                                const index = Array.from(photoGrid.children).indexOf(photoItem);
                                appData.kitchenInfo.photos.splice(index, 1);
                                localStorage.setItem('appData', JSON.stringify(appData));
                                photoItem.remove();
                            }
                        });
                    };
                    reader.readAsDataURL(file);
                });
            };
            
            input.click();
        });
    }

    // 厨房信息页面 - 删除照片
    const deletePhotoBtns = document.querySelectorAll('.delete-photo');
    deletePhotoBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (confirm('确定要删除这张照片吗？')) {
                this.closest('.photo-item').remove();
            }
        });
    });

    // 消费者评价页面 - 筛选
    const reviewFilter = document.querySelector('.reviews-filter select');
    if (reviewFilter) {
        reviewFilter.addEventListener('change', function() {
            // TODO: 实现评价筛选功能
            alert('筛选功能即将上线');
        });
    }

    // 我的资料页面 - 更换头像
    const changeAvatarBtn = document.querySelector('.profile-avatar button');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            
            input.onchange = function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const avatar = document.getElementById('profile-avatar');
                        avatar.src = e.target.result;
                        
                        // Save to appData
                        appData.profile.avatar = e.target.result;
                        localStorage.setItem('appData', JSON.stringify(appData));
                    };
                    reader.readAsDataURL(file);
                }
            };
            
            input.click();
        });
    }

    // 我的资料页面 - 定位按钮
    const locationBtn = document.querySelector('.input-group button');
    if (locationBtn) {
        locationBtn.addEventListener('click', function() {
            // TODO: 实现定位功能
            alert('定位功能即将上线');
        });
    }

    // 我的资料页面 - 身份证上传
    const idUploadBtns = document.querySelectorAll('.id-front button, .id-back button');
    idUploadBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            
            input.onchange = function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const isFront = btn.closest('.id-front') !== null;
                        const imgSelector = isFront ? '.id-front img' : '.id-back img';
                        document.querySelector(imgSelector).src = e.target.result;
                        
                        // Save to appData
                        if (!appData.profile.idCard) appData.profile.idCard = {};
                        appData.profile.idCard[isFront ? 'front' : 'back'] = e.target.result;
                        localStorage.setItem('appData', JSON.stringify(appData));
                    };
                    reader.readAsDataURL(file);
                }
            };
            
            input.click();
        });
    });

    // Update rating calculation
    function calculateAverageRating(reviews) {
        if (!reviews || reviews.length === 0) return 0;
        const totalStars = reviews.reduce((sum, review) => sum + review.stars, 0);
        const average = (totalStars / reviews.length).toFixed(1);
        return average;
    }

    // Update reviews display
    function initReviews() {
        const reviewsList = document.querySelector('.reviews-list');
        if (!reviewsList) return;

        // Clear existing reviews
        reviewsList.innerHTML = '';

        // Update rating display
        const ratingScore = document.querySelector('.rating-score');
        const ratingStars = document.querySelector('.rating-stars');
        const ratingCount = document.querySelector('.rating-count');
        const rating = calculateAverageRating(appData.reviews);

        if (ratingScore) {
            ratingScore.textContent = rating;
        }

        if (ratingStars) {
            const stars = ratingStars.querySelectorAll('i');
            stars.forEach((star, index) => {
                if (index < Math.floor(rating)) {
                    star.className = 'bi bi-star-fill';
                } else if (index === Math.floor(rating) && rating % 1 !== 0) {
                    star.className = 'bi bi-star-half';
                } else {
                    star.className = 'bi bi-star';
                }
            });
        }

        if (ratingCount) {
            ratingCount.textContent = `共 ${appData.reviews.length} 条评价`;
        }

        // Update review stats
        const goodRate = document.querySelector('.stat-value');
        if (goodRate) {
            const goodReviews = appData.reviews.filter(review => review.stars >= 4).length;
            const percentage = appData.reviews.length > 0 ? Math.round((goodReviews / appData.reviews.length) * 100) : 0;
            goodRate.textContent = `${percentage}%`;
        }
    }

    // Replace Google Maps with Leaflet
    function initMap() {
        console.log('🗺️ initMap called');
        console.log('🔍 Checking if Leaflet is available:', typeof L !== 'undefined');
        
        if (typeof L === 'undefined') {
            console.error('❌ Leaflet is not loaded!');
            return;
        }
        
        const mapElement = document.getElementById('map');
        console.log('🎯 Map element found:', !!mapElement);
        
        if (!mapElement) {
            console.error('❌ Map element not found!');
            return;
        }
        
        try {
            // Create a map centered at a default location
            console.log('🏗️ Creating map...');
            const map = L.map('map').setView([39.9042, 116.4074], 15);
            console.log('✅ Map created successfully');
            
            // Add OpenStreetMap tiles
            console.log('🗺️ Adding tiles...');
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            console.log('✅ Tiles added successfully');

            // Add click listener to update location button
            const editLocationBtn = document.getElementById('edit-location-btn');
            if (editLocationBtn) {
                editLocationBtn.addEventListener('click', function() {
                    console.log('📍 Location update requested');
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                const pos = {
                                    lat: position.coords.latitude,
                                    lng: position.coords.longitude
                                };
                                
                                console.log('📍 Got position:', pos);
                                
                                // Update map
                                map.setView([pos.lat, pos.lng], 15);
                                
                                // Add or update marker
                                if (window.locationMarker) {
                                    window.locationMarker.setLatLng([pos.lat, pos.lng]);
                                } else {
                                    window.locationMarker = L.marker([pos.lat, pos.lng]).addTo(map);
                                }
                                
                                // Save location to app data
                                appData.profile.location = pos;
                                localStorage.setItem('appData', JSON.stringify(appData));
                                
                                showToast('位置已更新');
                            },
                            (error) => {
                                console.error('Error getting location:', error);
                                showToast('无法获取位置信息，请检查位置权限设置', 'error');
                            }
                        );
                    } else {
                        showToast('您的浏览器不支持地理定位', 'error');
                    }
                });
            }
        } catch (error) {
            console.error('❌ Error initializing map:', error);
        }
    }

    // 处理多张图片上传
    function handleMultipleImages(files) {
        const imagePromises = Array.from(files).map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        });

        return Promise.all(imagePromises);
    }

    // 处理图片文件
    function handleImageFiles(files) {
        const imagePreviewContainer = document.getElementById('dish-images-preview');
        
        handleMultipleImages(files).then(imageUrls => {
            imageUrls.forEach(url => {
                const img = document.createElement('img');
                img.src = url;
                img.className = 'dish-preview-image';
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '<i class="bi bi-x"></i>';
                removeBtn.onclick = () => img.remove();
                
                img.appendChild(removeBtn);
                imagePreviewContainer.appendChild(img);
            });
        });
    }

    // 初始化页面
    function initPage() {
        // Load data first
        loadData();
        
        // Check if setup is completed
        if (!isSetupCompleted()) {
            showSetupWizard();
            return; // Don't initialize the rest until setup is complete
        }
        
        // 初始化菜品页面
        renderDishes();
        
        // 初始化接单设置页面
        initOrderSettings();
        
        // 初始化厨房信息页面
        initKitchenInfo();
        
        // 初始化消费者评价页面
        initReviews();
        
        // 初始化我的资料页面
        initProfile();
        
        // 设置事件监听器
        setupEventListeners();
        initMap();
        updateProfileStats();
    }

    // 初始化接单设置页面
    function initOrderSettings() {
        // 设置日期选择
        const dayItems = document.querySelectorAll('.day-item');
        dayItems.forEach((item, index) => {
            if (appData.settings.orderTime.days[index]) {
                item.classList.add('active');
            }
        });
        
        // 设置时间
        const orderTimeInputs = document.querySelectorAll('#orders-page .time-range input');
        if (orderTimeInputs.length >= 2) {
            orderTimeInputs[0].value = appData.settings.orderTime.startTime;
            orderTimeInputs[1].value = appData.settings.orderTime.endTime;
        }
        
        // 设置取餐规则
        const pickupRuleInputs = document.querySelectorAll('input[name="pickupRule"]');
        pickupRuleInputs.forEach(input => {
            if (input.id === appData.settings.pickupRule) {
                input.checked = true;
            }
        });
        
        // 设置配送选项
        const homeDeliveryCheckbox = document.getElementById('homeDelivery');
        const fixedPickupCheckbox = document.getElementById('fixedPickup');
        
        if (homeDeliveryCheckbox) {
            homeDeliveryCheckbox.checked = appData.settings.delivery.homeDelivery;
            const homeDeliveryOptions = document.getElementById('homeDeliveryOptions');
            if (homeDeliveryOptions) {
                homeDeliveryOptions.style.display = appData.settings.delivery.homeDelivery ? 'block' : 'none';
            }
        }
        
        if (fixedPickupCheckbox) {
            fixedPickupCheckbox.checked = appData.settings.delivery.fixedPickup;
            const fixedPickupOptions = document.getElementById('fixedPickupOptions');
            if (fixedPickupOptions) {
                fixedPickupOptions.style.display = appData.settings.delivery.fixedPickup ? 'block' : 'none';
            }
        }
        
        // 设置配送范围和费用
        const deliveryRangeInput = document.getElementById('deliveryRange');
        const deliveryFeeInput = document.getElementById('deliveryFee');
        
        if (deliveryRangeInput) {
            deliveryRangeInput.value = appData.settings.delivery.range;
        }
        
        if (deliveryFeeInput) {
            deliveryFeeInput.value = appData.settings.delivery.fee;
        }
        
        // 设置固定取餐地点和时间
        const pickupLocationInput = document.getElementById('pickupLocation');
        const pickupTimeInputs = document.querySelectorAll('#fixedPickupOptions .time-range input');
        
        if (pickupLocationInput) {
            pickupLocationInput.value = appData.settings.delivery.location;
        }
        
        if (pickupTimeInputs.length >= 2) {
            pickupTimeInputs[0].value = appData.settings.delivery.pickupStartTime;
            pickupTimeInputs[1].value = appData.settings.delivery.pickupEndTime;
        }
    }

    // 初始化厨房信息页面
    function initKitchenInfo() {
        const kitchenForm = document.getElementById('kitchen-form');
        const uploadQrBtn = document.getElementById('upload-qr-btn');
        const wechatQr = document.getElementById('wechat-qr');

        // 微信二维码上传
        if (uploadQrBtn && wechatQr) {
            uploadQrBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                
                input.onchange = function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            wechatQr.src = e.target.result;
                            // 清除验证错误
                            uploadQrBtn.closest('.contact-item').classList.remove('is-invalid');
                        };
                        reader.readAsDataURL(file);
                    }
                };
                
                input.click();
            });
        }

        // 表单提交
        if (kitchenForm) {
            kitchenForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                if (validateKitchenForm()) {
                    const formData = {
                        photos: Array.from(document.querySelectorAll('.photo-item img')).map(img => img.src),
                        introduction: document.getElementById('kitchen-intro').value,
                        wechatQR: wechatQr.src,
                        phone: document.getElementById('kitchen-phone').value
                    };
                    
                    appData.kitchenInfo = formData;
                    localStorage.setItem('appData', JSON.stringify(appData));
                    
                    // Go back to main page
                    document.querySelectorAll('.page').forEach(page => {
                        page.classList.remove('active');
                    });
                    document.getElementById('main-page').classList.add('active');
                    
                    // Update navigation
                    document.querySelectorAll('.nav-item').forEach(item => {
                        item.classList.remove('active');
                        if (item.getAttribute('data-page') === 'main') {
                            item.classList.add('active');
                        }
                    });
                    
                    showToast('厨房信息已保存');
                }
            });
        }
    }

    // 验证厨房表单
    function validateKitchenForm() {
        const form = document.getElementById('kitchen-form');
        let isValid = true;

        // 验证照片
        const photos = document.querySelectorAll('.photo-item img');
        if (photos.length === 0) {
            document.querySelector('.photo-upload').classList.add('is-invalid');
            isValid = false;
        }

        // 验证个人简介
        const intro = document.getElementById('kitchen-intro');
        if (!intro.value.trim()) {
            intro.classList.add('is-invalid');
            isValid = false;
        }

        // 验证微信二维码
        const qrCode = document.getElementById('wechat-qr');
        if (qrCode.src.includes('placeholder')) {
            qrCode.closest('.contact-item').classList.add('is-invalid');
            isValid = false;
        }

        // 验证电话号码
        const phone = document.getElementById('kitchen-phone');
        if (!phone.value.trim()) {
            phone.classList.add('is-invalid');
            isValid = false;
        }

        return isValid;
    }

    // 初始化我的资料页面
    function initProfile() {
        const profileForm = document.getElementById('profile-form');
        const changeAvatarBtn = document.getElementById('change-avatar-btn');
        const profileAvatar = document.getElementById('profile-avatar-img');
        const uploadIdFrontBtn = document.getElementById('upload-id-front-btn');
        const uploadIdBackBtn = document.getElementById('upload-id-back-btn');
        const idFrontImg = document.getElementById('id-front-img');
        const idBackImg = document.getElementById('id-back-img');

        // 更换头像
        if (changeAvatarBtn && profileAvatar) {
            changeAvatarBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                
                input.onchange = function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            profileAvatar.src = e.target.result;
                        };
                        reader.readAsDataURL(file);
                    }
                };
                
                input.click();
            });
        }

        // 身份证上传
        if (uploadIdFrontBtn && idFrontImg) {
            uploadIdFrontBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                
                input.onchange = function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            idFrontImg.src = e.target.result;
                        };
                        reader.readAsDataURL(file);
                    }
                };
                
                input.click();
            });
        }

        if (uploadIdBackBtn && idBackImg) {
            uploadIdBackBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                
                input.onchange = function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            idBackImg.src = e.target.result;
                        };
                        reader.readAsDataURL(file);
                    }
                };
                
                input.click();
            });
        }

        // 表单提交
        if (profileForm) {
            profileForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                if (validateProfileForm()) {
                    const formData = {
                        avatar: profileAvatar.src,
                        nickname: document.getElementById('nickname').value,
                        address: document.getElementById('address').value,
                        wechat: document.getElementById('wechat').value,
                        phone: document.getElementById('phone').value,
                        idCard: {
                            front: idFrontImg.src,
                            back: idBackImg.src
                        }
                    };
                    
                    appData.profile = { ...appData.profile, ...formData };
                    localStorage.setItem('appData', JSON.stringify(appData));
                    
                    // Go back to main page
                    document.querySelectorAll('.page').forEach(page => {
                        page.classList.remove('active');
                    });
                    document.getElementById('main-page').classList.add('active');
                    
                    // Update navigation
                    document.querySelectorAll('.nav-item').forEach(item => {
                        item.classList.remove('active');
                        if (item.getAttribute('data-page') === 'main') {
                            item.classList.add('active');
                        }
                    });
                    
                    showToast('个人资料已保存');
                }
            });
        }
    }

    // 验证个人资料表单
    function validateProfileForm() {
        const form = document.getElementById('profile-form');
        let isValid = true;

        // 验证必填字段
        const requiredFields = ['nickname', 'address', 'wechat', 'phone'];
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                field.classList.add('is-invalid');
                isValid = false;
            }
        });

        return isValid;
    }

    // 显示提示消息
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.appendChild(toast);
        document.body.appendChild(container);
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // 自动移除
        toast.addEventListener('hidden.bs.toast', () => {
            container.remove();
        });
    }

    // 加载数据
    function loadData() {
        const savedData = localStorage.getItem('appData');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            Object.assign(appData, parsed);
        }
    }

    // 更新个人资料统计
    function updateProfileStats() {
        document.getElementById('total-dishes').textContent = appData.dishes.length;
        document.getElementById('total-orders').textContent = appData.profile.stats.totalOrders;
        document.getElementById('average-rating').textContent = calculateAverageRating(appData.reviews);
    }

    // Settings buttons functionality
    document.getElementById('account-settings-btn').addEventListener('click', function() {
        showSettingsPage('account');
    });

    document.getElementById('notification-settings-btn').addEventListener('click', function() {
        showSettingsPage('notifications');
    });

    document.getElementById('privacy-settings-btn').addEventListener('click', function() {
        showSettingsPage('privacy');
    });

    function showSettingsPage(type) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show settings page
        const settingsPage = document.getElementById('settings-page');
        settingsPage.classList.add('active');
        
        // Update settings content based on type
        const settingsContent = document.getElementById('settings-content');
        switch(type) {
            case 'account':
                settingsContent.innerHTML = `
                    <h3>账号设置</h3>
                    <div class="form-group">
                        <label for="username">用户名</label>
                        <input type="text" class="form-control" id="username" value="${appData.profile.nickname || ''}">
                    </div>
                    <div class="form-group">
                        <label for="email">邮箱</label>
                        <input type="email" class="form-control" id="email" value="${appData.profile.email || ''}">
                    </div>
                    <button class="btn btn-primary" onclick="saveAccountSettings()">保存更改</button>
                `;
                break;
            case 'notifications':
                settingsContent.innerHTML = `
                    <h3>通知设置</h3>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="order-notifications" ${appData.settings.notifications?.orders ? 'checked' : ''}>
                        <label class="form-check-label" for="order-notifications">订单通知</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="review-notifications" ${appData.settings.notifications?.reviews ? 'checked' : ''}>
                        <label class="form-check-label" for="review-notifications">评价通知</label>
                    </div>
                    <button class="btn btn-primary" onclick="saveNotificationSettings()">保存更改</button>
                `;
                break;
            case 'privacy':
                settingsContent.innerHTML = `
                    <h3>隐私设置</h3>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="show-phone" ${appData.settings.privacy?.showPhone ? 'checked' : ''}>
                        <label class="form-check-label" for="show-phone">显示电话号码</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="show-address" ${appData.settings.privacy?.showAddress ? 'checked' : ''}>
                        <label class="form-check-label" for="show-address">显示地址</label>
                    </div>
                    <button class="btn btn-primary" onclick="savePrivacySettings()">保存更改</button>
                `;
                break;
        }
    }

    function saveAccountSettings() {
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        
        if (!username.trim()) {
            showToast('用户名不能为空', 'error');
            return;
        }
        
        appData.profile.nickname = username;
        appData.profile.email = email;
        
        // Update profile name display
        document.getElementById('profile-name').textContent = username;
        
        // Save to localStorage
        localStorage.setItem('appData', JSON.stringify(appData));
        
        // Go back to main page
        goToMainPage();
    }

    function saveNotificationSettings() {
        appData.settings.notifications = {
            orders: document.getElementById('order-notifications').checked,
            reviews: document.getElementById('review-notifications').checked
        };
        
        localStorage.setItem('appData', JSON.stringify(appData));
        showToast('通知设置已保存');
        
        // Go back to main page
        goToMainPage();
    }

    function savePrivacySettings() {
        appData.settings.privacy = {
            showPhone: document.getElementById('show-phone').checked,
            showAddress: document.getElementById('show-address').checked
        };
        
        localStorage.setItem('appData', JSON.stringify(appData));
        showToast('隐私设置已保存');
        
        // Go back to main page
        goToMainPage();
    }

    // Edit description functionality
    document.getElementById('edit-description-btn').addEventListener('click', function() {
        const description = document.getElementById('profile-description');
        const currentText = description.textContent;
        
        // Create textarea for editing
        const textarea = document.createElement('textarea');
        textarea.className = 'form-control';
        textarea.value = currentText;
        textarea.rows = 3;
        
        // Replace text with textarea
        description.replaceWith(textarea);
        
        // Add save button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary btn-sm mt-2';
        saveBtn.textContent = '保存';
        saveBtn.onclick = function() {
            const newText = textarea.value.trim();
            if (newText) {
                description.textContent = newText;
                appData.profile.description = newText;
                localStorage.setItem('appData', JSON.stringify(appData));
                textarea.replaceWith(description);
                saveBtn.remove();
                showToast('个人简介已更新');
            } else {
                showToast('个人简介不能为空', 'error');
            }
        };
        
        textarea.parentNode.insertBefore(saveBtn, textarea.nextSibling);
        textarea.focus();
    });

    // Edit kitchen info functionality
    document.getElementById('edit-kitchen-btn').addEventListener('click', function() {
        // Show kitchen page
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById('kitchen-page').classList.add('active');
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
    });

    // Save kitchen info
    document.getElementById('kitchen-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateKitchenForm()) {
            const formData = {
                photos: Array.from(document.querySelectorAll('.photo-item img')).map(img => img.src),
                introduction: document.getElementById('kitchen-intro').value,
                wechatQR: document.getElementById('wechat-qr').src,
                phone: document.getElementById('kitchen-phone').value
            };
            
            appData.kitchenInfo = formData;
            localStorage.setItem('appData', JSON.stringify(appData));
            
            // Go back to main page
            goToMainPage();
        }
    });

    // Save profile info
    document.getElementById('profile-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateProfileForm()) {
            const formData = {
                avatar: document.getElementById('profile-avatar-img').src,
                nickname: document.getElementById('nickname').value,
                address: document.getElementById('address').value,
                wechat: document.getElementById('wechat').value,
                phone: document.getElementById('phone').value,
                idCard: {
                    front: document.getElementById('id-front-img').src,
                    back: document.getElementById('id-back-img').src
                }
            };
            
            appData.profile = { ...appData.profile, ...formData };
            localStorage.setItem('appData', JSON.stringify(appData));
            
            // Go back to main page
            goToMainPage();
        }
    });

    // Helper function to go to main page
    function goToMainPage() {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show main page
        document.getElementById('main-page').classList.add('active');
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === 'main') {
                item.classList.add('active');
            }
        });
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('确定要退出登录吗？')) {
                // Clear user data
                localStorage.removeItem('cookUser');
                localStorage.removeItem('consumerUser');
                localStorage.removeItem('appData');
                
                // Show success message
                showToast('已成功退出登录');
                
                // Redirect to login page after a short delay
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            }
        });
    }

    // 初始化页面
    initPage();
}); 