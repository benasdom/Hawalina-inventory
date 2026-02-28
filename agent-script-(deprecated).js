// Agent Portal JavaScript

let currentAgentId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    populateAgentSelector();
});

// Populate agent selector (for demo)
function populateAgentSelector() {
    const select = document.getElementById('agentSelect');
    
    demoData.agents.forEach(agent => {
        const option = document.createElement('option');
        option.value = agent.id;
        option.textContent = `${agent.name} (${agent.id})`;
        select.appendChild(option);
    });
}

// Load agent data
function loadAgentData() {
    currentAgentId = document.getElementById('agentSelect').value;
    
    if (!currentAgentId) {
        document.getElementById('noAgentSelected').style.display = 'block';
        document.getElementById('agentContent').style.display = 'none';
        return;
    }
    
    const agent = demoData.agents.find(a => a.id === currentAgentId);
    document.getElementById('agentName').textContent = agent.name;
    document.getElementById('noAgentSelected').style.display = 'none';
    document.getElementById('agentContent').style.display = 'block';
    
    loadDashboard();
    loadLevel1Table();
    loadLevel2Table();
    loadEarningsTable();
    loadAgentTree();
}

// Show sections
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.getElementById(sectionId)?.classList.add('active');
    event.target.classList.add('active');
}

// Load dashboard
function loadDashboard() {
    const level1 = getLevel1Referrals(currentAgentId);
    const level2 = getLevel2Referrals(currentAgentId);
    const totalCommission = getAgentTotalCommission(currentAgentId);
    
    const level1Commission = level1.reduce((sum, r) => sum + r.commissionsEarned, 0);
    const level2Commission = level2.reduce((sum, r) => sum + r.commissionsEarned, 0);
    
    document.getElementById('myLevel1Count').textContent = level1.length;
    document.getElementById('myLevel2Count').textContent = level2.length;
    document.getElementById('myTotalEarnings').textContent = `GHS ${totalCommission.toFixed(2)}`;
    document.getElementById('myMonthlyEarnings').textContent = `GHS ${totalCommission.toFixed(2)}`;
    
    document.getElementById('level1Commission').textContent = `GHS ${level1Commission.toFixed(2)}`;
    document.getElementById('level2Commission').textContent = `GHS ${level2Commission.toFixed(2)}`;
    document.getElementById('totalCommissionBreakdown').textContent = `GHS ${totalCommission.toFixed(2)}`;
    
    // Recent activity
    loadRecentActivity();
}

function loadRecentActivity() {
    const transactions = demoData.commissionTransactions
        .filter(t => t.agentId === currentAgentId)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    const activityList = document.getElementById('recentActivity');
    activityList.innerHTML = '';
    
    if (transactions.length === 0) {
        activityList.innerHTML = '<div class="no-data"><p>No activity yet</p></div>';
        return;
    }
    
    transactions.forEach(trans => {
        const referral = demoData.referrals.find(r => r.referralId === trans.referralId);
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon ${trans.level === 1 ? 'level1' : 'level2'}">
                ${trans.level === 1 ? '👥' : '🔗'}
            </div>
            <div class="activity-content">
                <strong>${referral?.referralName}</strong> made a sale
                <div class="activity-meta">
                    <span>${trans.date}</span>
                    <span>Level ${trans.level}</span>
                    <strong style="color: var(--success);">+GHS ${trans.commission.toFixed(2)}</strong>
                </div>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
}

// Load Level 1 table
function loadLevel1Table() {
    const level1Refs = getLevel1Referrals(currentAgentId);
    const tableBody = document.getElementById('level1Table');
    tableBody.innerHTML = '';
    
    if (level1Refs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No Level 1 referrals yet</td></tr>';
        return;
    }
    
    level1Refs.forEach(ref => {
        const subReferrals = demoData.referrals.filter(r => r.parentReferralId === ref.referralId);
        
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td><strong>${ref.referralId}</strong></td>
            <td>${ref.referralName}</td>
            <td>${ref.phone}</td>
            <td>${ref.dateAdded}</td>
            <td>GHS ${ref.totalSales.toFixed(2)}</td>
            <td><strong style="color: var(--success);">GHS ${ref.commissionsEarned.toFixed(2)}</strong></td>
            <td><span class="badge badge-secondary">${subReferrals.length}</span></td>
        `;
    });
}

// Load Level 2 table
function loadLevel2Table() {
    const level2Refs = getLevel2Referrals(currentAgentId);
    const tableBody = document.getElementById('level2Table');
    tableBody.innerHTML = '';
    
    if (level2Refs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No Level 2 referrals yet</td></tr>';
        return;
    }
    
    level2Refs.forEach(ref => {
        const level1Parent = demoData.referrals.find(r => r.referralId === ref.parentReferralId);
        
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td><strong>${ref.referralId}</strong></td>
            <td>${ref.referralName}</td>
            <td>${level1Parent?.referralName || 'N/A'}</td>
            <td>${ref.dateAdded}</td>
            <td>GHS ${ref.totalSales.toFixed(2)}</td>
            <td><strong style="color: var(--success);">GHS ${ref.commissionsEarned.toFixed(2)}</strong></td>
        `;
    });
}

// Load earnings table
function loadEarningsTable() {
    const transactions = demoData.commissionTransactions
        .filter(t => t.agentId === currentAgentId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const totalCommission = transactions.reduce((sum, t) => sum + t.commission, 0);
    
    document.getElementById('lifetimeEarnings').textContent = `GHS ${totalCommission.toFixed(2)}`;
    document.getElementById('yearlyEarnings').textContent = `GHS ${totalCommission.toFixed(2)}`;
    document.getElementById('monthlyEarnings').textContent = `GHS ${totalCommission.toFixed(2)}`;
    
    const tableBody = document.getElementById('earningsTable');
    tableBody.innerHTML = '';
    
    if (transactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No earnings yet</td></tr>';
        return;
    }
    
    transactions.forEach(trans => {
        const referral = demoData.referrals.find(r => r.referralId === trans.referralId);
        
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${trans.date}</td>
            <td>${referral?.referralName || 'N/A'}</td>
            <td><span class="badge badge-${trans.level === 1 ? 'primary' : 'secondary'}">Level ${trans.level}</span></td>
            <td>GHS ${trans.amount.toFixed(2)}</td>
            <td>${referral?.commissionRate || 0}%</td>
            <td><strong style="color: var(--success);">GHS ${trans.commission.toFixed(2)}</strong></td>
        `;
    });
}

// Load agent tree
function loadAgentTree() {
    const agent = demoData.agents.find(a => a.id === currentAgentId);
    const level1Refs = getLevel1Referrals(currentAgentId);
    const treeView = document.getElementById('agentTreeView');
    
    let treeHTML = `
        <div class="tree-node tree-root">
            <div class="node-content">
                <div class="node-icon">👤</div>
                <div class="node-info">
                    <strong>You (${agent.name})</strong>
                    <small>${agent.id}</small>
                </div>
            </div>
        </div>
    `;
    
    if (level1Refs.length > 0) {
        treeHTML += '<div class="tree-children">';
        
        level1Refs.forEach(ref1 => {
            const level2Refs = demoData.referrals.filter(r => r.parentReferralId === ref1.referralId);
            
            treeHTML += `
                <div class="tree-branch">
                    <div class="tree-node tree-level1">
                        <div class="node-content">
                            <div class="node-icon">👥</div>
                            <div class="node-info">
                                <strong>${ref1.referralName}</strong>
                                <small>${ref1.referralId}</small>
                                <div class="node-stats">
                                    <span>Sales: GHS ${ref1.totalSales}</span>
                                    <span>Your Commission: GHS ${ref1.commissionsEarned}</span>
                                </div>
                            </div>
                        </div>
                    </div>
            `;
            
            if (level2Refs.length > 0) {
                treeHTML += '<div class="tree-level2-container">';
                level2Refs.forEach(ref2 => {
                    treeHTML += `
                        <div class="tree-node tree-level2">
                            <div class="node-content">
                                <div class="node-icon">🔗</div>
                                <div class="node-info">
                                    <strong>${ref2.referralName}</strong>
                                    <small>${ref2.referralId}</small>
                                    <div class="node-stats">
                                        <span>Sales: GHS ${ref2.totalSales}</span>
                                        <span>Your Commission: GHS ${ref2.commissionsEarned}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                treeHTML += '</div>';
            }
            
            treeHTML += '</div>';
        });
        
        treeHTML += '</div>';
    } else {
        treeHTML += '<div class="no-data"><p>You don\'t have any referrals yet. Contact admin to get referrals assigned!</p></div>';
    }
    
    treeView.innerHTML = treeHTML;
}
