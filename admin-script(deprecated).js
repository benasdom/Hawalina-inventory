// Admin Portal JavaScript

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadOverview();
    populateAgentSelectors();
    loadAgentsTable();
    loadCommissionsTable();
    
    // Form submission
    document.getElementById('assignForm')?.addEventListener('submit', handleAssignReferral);
});

// Show/hide sections
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active from all menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId)?.classList.add('active');
    
    // Add active to clicked menu item
    event.target.classList.add('active');
}

// Load overview statistics
function loadOverview() {
    const totalAgents = demoData.agents.length;
    const totalReferrals = demoData.referrals.length;
    const totalCommissions = demoData.referrals.reduce((sum, r) => sum + r.commissionsEarned, 0);
    const activeReferrals = demoData.referrals.filter(r => r.totalSales > 0).length;
    
    document.getElementById('totalAgents').textContent = totalAgents;
    document.getElementById('totalReferrals').textContent = totalReferrals;
    document.getElementById('totalCommissions').textContent = `GHS ${totalCommissions.toFixed(2)}`;
    document.getElementById('activeReferrals').textContent = activeReferrals;
    
    // Load top performers
    loadTopPerformers();
}

function loadTopPerformers() {
    const agentStats = demoData.agents.map(agent => {
        const level1 = getLevel1Referrals(agent.id);
        const level2 = getLevel2Referrals(agent.id);
        const totalCommission = getAgentTotalCommission(agent.id);
        
        return {
            id: agent.id,
            name: agent.name,
            level1Count: level1.length,
            level2Count: level2.length,
            totalCommission: totalCommission
        };
    });
    
    // Sort by commission
    agentStats.sort((a, b) => b.totalCommission - a.totalCommission);
    
    const tableBody = document.getElementById('topPerformersTable');
    tableBody.innerHTML = '';
    
    agentStats.slice(0, 5).forEach(agent => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${agent.id}</td>
            <td>${agent.name}</td>
            <td><span class="badge badge-primary">${agent.level1Count}</span></td>
            <td><span class="badge badge-secondary">${agent.level2Count}</span></td>
            <td><strong style="color: var(--success);">GHS ${agent.totalCommission.toFixed(2)}</strong></td>
        `;
    });
}

// Load all agents table
function loadAgentsTable() {
    const tableBody = document.getElementById('agentsTable');
    tableBody.innerHTML = '';
    
    demoData.agents.forEach(agent => {
        const level1 = getLevel1Referrals(agent.id);
        const level2 = getLevel2Referrals(agent.id);
        const totalReferrals = level1.length + level2.length;
        const commission = getAgentTotalCommission(agent.id);
        
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td><strong>${agent.id}</strong></td>
            <td>${agent.name}</td>
            <td><span class="badge badge-primary">${level1.length}</span></td>
            <td><span class="badge badge-secondary">${level2.length}</span></td>
            <td>${totalReferrals}</td>
            <td><strong style="color: var(--success);">GHS ${commission.toFixed(2)}</strong></td>
            <td>
                <button class="btn-small" onclick="viewAgentTree('${agent.id}')">View Tree</button>
            </td>
        `;
    });
}

// Filter agents
function filterAgents() {
    const searchTerm = document.getElementById('searchAgent').value.toLowerCase();
    const rows = document.querySelectorAll('#agentsTable tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Populate agent selectors
function populateAgentSelectors() {
    const selectors = [
        document.getElementById('parentAgent'),
        document.getElementById('treeAgent')
    ];
    
    selectors.forEach(select => {
        if (select) {
            demoData.agents.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = `${agent.name} (${agent.id})`;
                select.appendChild(option);
            });
        }
    });
}

// Update level info when level changes
function updateLevelInfo() {
    const level = document.getElementById('referralLevel').value;
    const level2Options = document.getElementById('level2Options');
    const level1ParentSelect = document.getElementById('level1Parent');
    
    if (level === '2') {
        level2Options.style.display = 'block';
        
        // Get parent agent's level 1 referrals
        const parentAgentId = document.getElementById('parentAgent').value;
        if (parentAgentId) {
            const level1Refs = getLevel1Referrals(parentAgentId);
            level1ParentSelect.innerHTML = '<option value="">-- Select Level 1 Referral --</option>';
            
            level1Refs.forEach(ref => {
                const option = document.createElement('option');
                option.value = ref.referralId;
                option.textContent = `${ref.referralName} (${ref.referralId})`;
                level1ParentSelect.appendChild(option);
            });
        }
    } else {
        level2Options.style.display = 'none';
    }
}

// Handle assign referral form
function handleAssignReferral(e) {
    e.preventDefault();
    
    const formData = {
        parentAgentId: document.getElementById('parentAgent').value,
        referralId: document.getElementById('newReferralId').value,
        referralName: document.getElementById('newReferralName').value,
        phone: document.getElementById('newReferralPhone').value,
        level: parseInt(document.getElementById('referralLevel').value),
        commissionRate: parseFloat(document.getElementById('commissionRate').value),
        parentReferralId: document.getElementById('level2Options').style.display === 'none' ? 
            null : document.getElementById('level1Parent').value,
        dateAdded: new Date().toISOString().split('T')[0],
        totalSales: 0,
        commissionsEarned: 0
    };
    
    // Add to demo data
    demoData.referrals.push(formData);
    
    // Show success message
    const successMsg = document.getElementById('assignSuccess');
    successMsg.textContent = `✅ Successfully assigned ${formData.referralName} as Level ${formData.level} referral under ${demoData.agents.find(a => a.id === formData.parentAgentId).name}`;
    successMsg.style.display = 'block';
    
    // Reset form
    document.getElementById('assignForm').reset();
    
    // Reload tables
    loadOverview();
    loadAgentsTable();
    
    setTimeout(() => {
        successMsg.style.display = 'none';
    }, 5000);
}

// Load commissions table
function loadCommissionsTable() {
    const tableBody = document.getElementById('commissionsTable');
    tableBody.innerHTML = '';
    
    demoData.commissionTransactions.forEach(transaction => {
        const agent = demoData.agents.find(a => a.id === transaction.agentId);
        const referral = demoData.referrals.find(r => r.referralId === transaction.referralId);
        
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${transaction.agentId}</td>
            <td>${agent?.name || 'N/A'}</td>
            <td>${transaction.referralId}</td>
            <td>${referral?.referralName || 'N/A'}</td>
            <td><span class="badge badge-${transaction.level === 1 ? 'primary' : 'secondary'}">Level ${transaction.level}</span></td>
            <td>GHS ${transaction.amount.toFixed(2)}</td>
            <td>${referral?.commissionRate || 0}%</td>
            <td><strong style="color: var(--success);">GHS ${transaction.commission.toFixed(2)}</strong></td>
        `;
    });
}

// View agent tree
function viewAgentTree(agentId) {
    document.getElementById('treeAgent').value = agentId;
    showTree();
    showSection('tree');
}

// Show referral tree
function showTree() {
    const agentId = document.getElementById('treeAgent').value;
    const treeView = document.getElementById('treeView');
    
    if (!agentId) {
        treeView.innerHTML = '<div class="no-data"><div class="no-data-icon">🌳</div><p>Select an agent to view their referral tree</p></div>';
        return;
    }
    
    const agent = demoData.agents.find(a => a.id === agentId);
    const level1Refs = getLevel1Referrals(agentId);
    
    let treeHTML = `
        <div class="tree-node tree-root">
            <div class="node-content">
                <div class="node-icon">👤</div>
                <div class="node-info">
                    <strong>${agent.name}</strong>
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
                                    <span>Commission: GHS ${ref1.commissionsEarned}</span>
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
                                        <span>Commission: GHS ${ref2.commissionsEarned}</span>
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
        treeHTML += '<div class="no-data"><p>No referrals yet</p></div>';
    }
    
    treeView.innerHTML = treeHTML;
}

// Export commissions
function exportCommissions() {
    let csv = 'Agent ID,Agent Name,Referral ID,Referral Name,Level,Sales Amount,Commission Rate,Commission Earned\n';
    
    demoData.commissionTransactions.forEach(transaction => {
        const agent = demoData.agents.find(a => a.id === transaction.agentId);
        const referral = demoData.referrals.find(r => r.referralId === transaction.referralId);
        
        csv += `${transaction.agentId},${agent?.name},${transaction.referralId},${referral?.referralName},${transaction.level},${transaction.amount},${referral?.commissionRate}%,${transaction.commission}\n`;
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hawalina_commissions_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
}
