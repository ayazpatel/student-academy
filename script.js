let chargeSheetGroups = {};
        let penalCodes = {};
        let currentCategoryFilter = 'all';
        let currentTab = 'charge-sheet'; 
        
        // GLOBAL CART STORAGE SYSTEM ENGINE
        let globalCart = [];
        const CMS_DEFAULT_VALUE = 5;

        let radioCodesData = {};
        let activeRadioCodes = [];
        let currentRadioCategory = '10-CODES';
        let currentPriorityFilter = 'all';

        const getBaseUrl = () => {
            if (window.location.hostname.includes("github.io")) {
                return "https://ayazpatel.github.io/student-academy/";
            }
            return "./"; 
        };

        // window.onload = async function() {
        //     const baseUrl = getBaseUrl();
        //     try {
        //         const [chargesResponse, penalCodesResponse] = await Promise.all([
        //             fetch(`${baseUrl}chargesPresets.json`),
        //             fetch(`${baseUrl}penalCodes.json`),
        //             fetch(`${baseUrl}radioCodes.json`),
        //         ]);

        //         if (!chargesResponse.ok || !penalCodesResponse.ok) throw new Error("HTTP verification failed.");

        //         chargeSheetGroups = await chargesResponse.json();
        //         penalCodes = await penalCodesResponse.json();
        //         radioCodesData = await radioCodesResponse.json();

        //         renderChargeSheetGrid();
        //         renderPenalCodesTable();
        //         updateCartUI();
        //         changeRadioCategory();

        //         const preloader = document.getElementById('appPreloader');
        //         const content = document.getElementById('mainAppContent');
        //         preloader.style.opacity = '0';
        //         preloader.style.visibility = 'hidden';
        //         content.style.opacity = '1';
        //     } catch (error) {
        //         console.error("Data Fetch Error:", error);
        //         document.getElementById('preloaderText').innerText = `Sync Failed: ${error.message}`;
        //         document.getElementById('preloaderText').style.color = 'var(--danger-text)';
        //     }
        // };

        window.onload = async function() {
            const baseUrl = getBaseUrl();
            try {
                // 1. THIS LINE MUST INCLUDE radioCodesResponse
                const [chargesResponse, penalCodesResponse, radioCodesResponse] = await Promise.all([
                    fetch(`${baseUrl}chargesPresets.json`),
                    fetch(`${baseUrl}penalCodes.json`),
                    fetch(`${baseUrl}radioCodes.json`) // 2. THIS LINE MUST FETCH THE NEW JSON
                ]);

                // 3. THIS LINE MUST CHECK ALL THREE FOR .ok
                if (!chargesResponse.ok || !penalCodesResponse.ok || !radioCodesResponse.ok) {
                    throw new Error("HTTP verification failed.");
                }

                chargeSheetGroups = await chargesResponse.json();
                penalCodes = await penalCodesResponse.json();
                radioCodesData = await radioCodesResponse.json(); // 4. NOW THIS WILL WORK

                renderChargeSheetGrid();
                renderPenalCodesTable();
                updateCartUI();
                
                // Initialize Radio Codes tab
                if (typeof changeRadioCategory === "function") {
                    changeRadioCategory(); 
                }

                const preloader = document.getElementById('appPreloader');
                const content = document.getElementById('mainAppContent');
                preloader.style.opacity = '0';
                preloader.style.visibility = 'hidden';
                content.style.opacity = '1';
            } catch (error) {
                console.error("Data Fetch Error:", error);
                document.getElementById('preloaderText').innerText = `Sync Failed: ${error.message}`;
                document.getElementById('preloaderText').style.color = 'var(--danger-text)';
            }
        };

        function toggleSidebar() {
            document.getElementById('sidebarMenu').classList.toggle('open');
            document.getElementById('sidebarOverlay').classList.toggle('visible');
            document.getElementById('menuToggle').classList.toggle('open');
        }

        // CONTROL TAB INDEX ACTIONS EXECUTION STACK
        function switchTab(tabId) {
            // tabSwitchPauseIFrame();

            currentTab = tabId; 
            const sidebar = document.getElementById('sidebarMenu');
            if (sidebar.classList.contains('open')) toggleSidebar();

            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            document.getElementById(tabId).classList.add('active');
            
            if(tabId === 'charge-sheet') document.getElementById('btn-tab-charge-sheet').classList.add('active');
            if(tabId === 'penal-codes') document.getElementById('btn-tab-penal-codes').classList.add('active');
            if(tabId === 'booking-summary') document.getElementById('btn-tab-booking-summary').classList.add('active');
            if(tabId === 'ten-codes') document.getElementById('btn-tab-ten-codes').classList.add('active');
            if(tabId === 'ui-training') document.getElementById('btn-tab-ui-training').classList.add('active');
            if(tabId === 'sop-training') document.getElementById('btn-tab-sop-training').classList.add('active');
            

            updateCartUI();
        }

        // MATHEMATICAL ENGINE FOR CORE CMS METRICS CALCULATIONS
        function calculateCMSValue(jailTimeMonths) {
            if (jailTimeMonths === 999999 || jailTimeMonths === 9999997 || jailTimeMonths === 9999999 || jailTimeMonths === 99999999) {
                return 0; 
            }
            if (jailTimeMonths === 0) {
                return 1 * CMS_DEFAULT_VALUE; 
            }
            return jailTimeMonths * CMS_DEFAULT_VALUE;
        }

        function renderChargeSheetGrid() {
            const grid = document.getElementById('robberyGrid');
            grid.innerHTML = '';

            for (const key in chargeSheetGroups) {
                const group = chargeSheetGroups[key];
                
                // Calculate preset cap total CMS constraints mapping formula parameters dynamically
                let presetCMS = 0;
                group.charges.forEach(c => { presetCMS += calculateCMSValue(c.jailTime); });

                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div>
                        <h3>${group.label}</h3>
                        <div class="card-meta">Max Cap: $${group.capFine} / ${group.capTime} Months / ${presetCMS} CMS Task</div>
                    </div>
                    <div class="card-actions">
                        <span style="font-size:12px; color:var(--text-secondary); font-weight:500;">Linked Crimes: ${group.charges.length}</span>
                        <button class="btn-add" onclick="addPresetToCart('${key}')">Load Preset</button>
                    </div>
                `;
                grid.appendChild(card);
            }
        }

        function renderPenalCodesTable() {
            const tbody = document.getElementById('penalCodesTableBody');
            tbody.innerHTML = '';

            for (const key in penalCodes) {
                const item = penalCodes[key];
                const tr = document.createElement('tr');
                tr.setAttribute('data-category', item.category);
                tr.setAttribute('data-name', item.label.toLowerCase());
                tr.setAttribute('data-desc', item.description.toLowerCase());

                let readableCategory = item.category.replace('_', ' ');
                let fineDisplay = item.fine === 999999 ? "Judicial Discretion" : `$${item.fine.toLocaleString()}`;
                
                let isHUT = (item.jailTime === 999999 || item.jailTime === 9999999 || item.jailTime === 99999999);
                let jailDisplay = isHUT ? "H.U.T" : `${item.jailTime} Months`;
                
                let cmsDisplay = isHUT ? "N/A" : `${calculateCMSValue(item.jailTime)}`;

                tr.innerHTML = `
                    <td style="font-weight:600; color:var(--text-main); font-size:15px; letter-spacing:-0.2px;">${item.label}</td>
                    <td><span class="badge ${item.category}">${readableCategory}</span></td>
                    <td style="font-size:13.5px; line-height:1.5;">${item.description}</td>
                    <td style="font-weight:600; color:${item.fine === 999999 ? 'var(--text-muted)' : 'var(--text-main)'}">${fineDisplay}</td>
                    <td style="font-weight:600; color:var(--text-main)">${jailDisplay}</td>
                    <td style="font-weight:600; color:var(--accent)">${cmsDisplay}</td>
                    <td style="text-align:center;">
                        <button class="btn-add" style="padding: 6px 12px; font-size: 12px;" onclick="addSingleCodeToCart('${key}')">+ Add</button>
                    </td>
                `;
                tbody.appendChild(tr);
            }
        }

        function addPresetToCart(groupKey) {
            const group = chargeSheetGroups[groupKey];
            let duplicateFound = false;

            group.charges.forEach(charge => {
                const isDuplicate = globalCart.some(cartItem => cartItem.label.toLowerCase() === charge.label.toLowerCase());
                
                if (!isDuplicate) {
                    globalCart.push({
                        label: charge.label,
                        fine: charge.fine,
                        jailTime: charge.jailTime,
                        cms: calculateCMSValue(charge.jailTime)
                    });
                } else {
                    duplicateFound = true;
                }
            });

            if (duplicateFound) {
                alert("Notice: Duplicate charges within this preset were skipped automatically.");
            }
            updateCartUI();
        }

        function addSingleCodeToCart(itemKey) {
            const item = penalCodes[itemKey];
            const isDuplicate = globalCart.some(cartItem => cartItem.label.toLowerCase() === item.label.toLowerCase());

            if (isDuplicate) {
                alert(`The charge "${item.label}" has already been processed into the summary workspace.`);
                return; 
            }

            globalCart.push({
                label: item.label,
                fine: item.fine === 999999 ? 0 : item.fine, 
                jailTime: (item.jailTime === 999999 || item.jailTime === 9999999) ? 0 : item.jailTime,
                cms: calculateCMSValue(item.jailTime === 999999 || item.jailTime === 9999999 ? 0 : item.jailTime)
            });
            updateCartUI();
        }

        function removeCartItem(index) {
            globalCart.splice(index, 1);
            updateCartUI();
        }

        function clearGlobalCart() {
            globalCart = [];
            updateCartUI();
        }

        function updateCartUI() {
            const totalCount = globalCart.length;
            document.getElementById('globalCartBadge').innerText = totalCount;
            document.getElementById('floatingCartBadge').innerText = totalCount;

            const floatBar = document.getElementById('floatingSummaryBar');
            
            if (totalCount > 0 && window.innerWidth < 992 && currentTab !== 'booking-summary') {
                floatBar.classList.add('visible');
            } else {
                floatBar.classList.remove('visible');
            }

            const container = document.getElementById('workspaceCartItems');
            container.innerHTML = '';

            let accumulatedFine = 0;
            let accumulatedTime = 0;
            let accumulatedCMS = 0;

            if (globalCart.length === 0) {
                container.innerHTML = `<p style="color: var(--text-muted); font-size: 14px; text-align: center; padding: 40px 0;">No active legal codes or operations presets added to execution stack.</p>`;
            } else {
                globalCart.forEach((item, index) => {
                    accumulatedFine += item.fine;
                    accumulatedTime += item.jailTime;
                    accumulatedCMS += item.cms;

                    const row = document.createElement('div');
                    row.className = 'summary-item-row';
                    row.innerHTML = `
                        <div class="details-pane">
                            <h4>${item.label}</h4>
                            <p>$${item.fine.toLocaleString()} / ${item.jailTime} Months [${item.cms} CMS Task]</p>
                        </div>
                        <button class="btn-action-cart remove" onclick="removeCartItem(${index})">Remove</button>
                    `;
                    container.appendChild(row);
                });
            }

            // Sync structural running summary aggregate boxes variables
            document.getElementById('boxFine').innerText = `$${accumulatedFine.toLocaleString()}`;
            document.getElementById('boxTime').innerText = `${accumulatedTime} Months`;
            document.getElementById('boxCMS').innerText = `${accumulatedCMS} CMS Task`;
            document.getElementById('boxGrandTotal').innerText = `$${accumulatedFine.toLocaleString()} & ${accumulatedTime} Months [${accumulatedCMS} CMS Task]`;
        }

        function filterCategory(category, element) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            element.classList.add('active');
            currentCategoryFilter = category;
            filterTable();
        }

        function filterTable() {
            const query = document.getElementById('searchBox').value.toLowerCase();
            const rows = document.querySelectorAll('#penalCodesTableBody tr');

            rows.forEach(row => {
                const categoryMatch = (currentCategoryFilter === 'all' || row.getAttribute('data-category') === currentCategoryFilter);
                const nameMatch = row.getAttribute('data-name').includes(query);
                const descMatch = row.getAttribute('data-desc').includes(query);

                if (categoryMatch && (nameMatch || descMatch)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }

        // --- RADIO CODES LOGIC ---

        function changeRadioCategory() {
            currentRadioCategory = document.getElementById('radioCodeCategory').value;
            const priorityFilters = document.getElementById('priorityFilters');
            const extraCols = document.querySelectorAll('.radio-extra-col');
            
            // Only show Priority filters and extra columns if 10-CODES is selected
            if (currentRadioCategory === '10-CODES') {
                priorityFilters.style.display = 'flex';
                extraCols.forEach(col => col.style.display = '');
            } else {
                priorityFilters.style.display = 'none';
                extraCols.forEach(col => col.style.display = 'none');
            }
            
            // Reset filters on category change
            document.getElementById('radioSearchBox').value = '';
            filterRadioPriority('all', document.querySelector('#priorityFilters .filter-btn'));
        }

        function filterRadioPriority(priority, element) {
            if (element) {
                document.querySelectorAll('#priorityFilters .filter-btn').forEach(btn => btn.classList.remove('active'));
                element.classList.add('active');
            }
            currentPriorityFilter = priority;
            applyRadioFilters();
        }

        function applyRadioFilters() {
            const query = document.getElementById('radioSearchBox').value.toLowerCase();
            // Default to empty array if category doesn't exist yet
            let data = radioCodesData[currentRadioCategory] || []; 
            
            activeRadioCodes = data.filter(item => {
                const matchesSearch = item.code.toLowerCase().includes(query) || item.meaning.toLowerCase().includes(query);
                
                let matchesPriority = true;
                if (currentRadioCategory === '10-CODES' && currentPriorityFilter !== 'all') {
                    matchesPriority = item.priority === currentPriorityFilter;
                }
                
                return matchesSearch && matchesPriority;
            });
            
            renderRadioTable();
        }

        function shuffleRadioCodes() {
            // Fisher-Yates Shuffle algorithm
            for (let i = activeRadioCodes.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [activeRadioCodes[i], activeRadioCodes[j]] = [activeRadioCodes[j], activeRadioCodes[i]];
            }
            renderRadioTable();
        }

        // function renderRadioTable() {
        //     const tbody = document.getElementById('radioCodesTableBody');
        //     tbody.innerHTML = '';
            
        //     if (activeRadioCodes.length === 0) {
        //         tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 30px 0;">No matching codes found.</td></tr>`;
        //         return;
        //     }

        //     activeRadioCodes.forEach(item => {
        //         const tr = document.createElement('tr');
        //         let extraHTML = '';
                
        //         // Only inject Color and Priority cells if we are in the 10-CODES category
        //         if (currentRadioCategory === '10-CODES') {
        //             extraHTML = `
        //                 <td style="font-weight:600; color: ${getColorForRadio(item.color)}">${item.color}</td>
        //                 <td><span class="badge" style="background: var(--bg-pill); color: var(--text-main);">${item.priority}</span></td>
        //             `;
        //         }
                
        //         tr.innerHTML = `
        //             <td style="font-weight:700; color:var(--accent); font-size:15px;">${item.code}</td>
        //             <td style="font-weight:500; color:var(--text-main); font-size:14px;">${item.meaning}</td>
        //             ${extraHTML}
        //         `;
        //         tbody.appendChild(tr);
        //     });
        // }

        function renderRadioTable() {
            const tbody = document.getElementById('radioCodesTableBody');
            tbody.innerHTML = '';
            
            if (activeRadioCodes.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 30px 0;">No matching codes found.</td></tr>`;
                return;
            }

            activeRadioCodes.forEach(item => {
                const tr = document.createElement('tr');
                let extraHTML = '';
                
                // Only inject Priority cell if we are in the 10-CODES category
                if (currentRadioCategory === '10-CODES') {
                    extraHTML = `
                        <td><span class="badge" style="background: var(--bg-pill); color: var(--text-main);">${item.priority}</span></td>
                    `;
                }
                
                tr.innerHTML = `
                    <td style="font-weight:700; color:var(--accent); font-size:15px;">${item.code}</td>
                    <td style="font-weight:500; color:var(--text-main); font-size:14px;">${item.meaning}</td>
                    ${extraHTML}
                `;
                tbody.appendChild(tr);
            });
        }

        // Helper function to map JSON color strings to actual CSS colors
        function getColorForRadio(colorName) {
            const map = {
                "Green": "#248a3d",
                "Pink": "#ff2d55",
                "White": "var(--text-secondary)",
                "Yellow": "#b26a00",
                "Red": "#d32f2f"
            };
            return map[colorName] || "var(--text-main)";
        }

        // TODO: need a fix for it
        function tabSwitchPauseIFrame() {
        const iframes = document.querySelectorAll('main iframe');
        
        iframes.forEach(iframe => {
            try {
                iframe.contentWindow.postMessage(
                    JSON.stringify({ event: 'command', func: 'pauseVideo' }), 
                    '*'
                );
            } catch (error) {
                console.error("IFrame execution state pause error:", error);
            }
        });
    }

        function updateSidebarIndicators() {

            const navMenu = document.getElementById("navMenu");

            if (!navMenu) return;

            const topArrow =
                document.getElementById("scrollTopIndicator");

            const bottomArrow =
                document.getElementById("scrollBottomIndicator");

            const maxScroll =
                navMenu.scrollHeight - navMenu.clientHeight;

            topArrow.classList.toggle(
                "show",
                navMenu.scrollTop > 5
            );

            bottomArrow.classList.toggle(
                "show",
                navMenu.scrollTop < maxScroll - 5
            );
        }

        window.addEventListener("load", () => {

            const navMenu =
                document.getElementById("navMenu");

            if(navMenu){

                updateSidebarIndicators();

                navMenu.addEventListener(
                    "scroll",
                    updateSidebarIndicators
                );
            }
        });