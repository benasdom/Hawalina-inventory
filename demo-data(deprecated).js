// Demo Data for Hawalina Referral System

const demoData = {
    agents: [
        { id: 'GHA-111111111-1', name: 'Kwame Asante', phone: '+233 24 111 1111', region: 'Ashanti', dateJoined: '2025-01-01' },
        { id: 'GHA-222222222-2', name: 'Ama Mensah', phone: '+233 24 222 2222', region: 'Greater Accra', dateJoined: '2025-01-05' },
        { id: 'GHA-333333333-3', name: 'Kofi Osei', phone: '+233 24 333 3333', region: 'Western', dateJoined: '2025-01-10' },
        { id: 'GHA-444444444-4', name: 'Akosua Boateng', phone: '+233 24 444 4444', region: 'Eastern', dateJoined: '2025-01-12' },
        { id: 'GHA-555555555-5', name: 'Yaw Owusu', phone: '+233 24 555 5555', region: 'Ashanti', dateJoined: '2025-01-15' },
    ],
    
    referrals: [
        // Kwame's network (GHA-111111111-1)
        { 
            parentAgentId: 'GHA-111111111-1',
            referralId: 'GHA-666666666-6',
            referralName: 'Sarah Addo',
            phone: '+233 24 666 6666',
            level: 1,
            parentReferralId: null,
            commissionRate: 5,
            dateAdded: '2025-01-20',
            totalSales: 2500,
            commissionsEarned: 125
        },
        {
            parentAgentId: 'GHA-111111111-1',
            referralId: 'GHA-777777777-7',
            referralName: 'Michael Appiah',
            phone: '+233 24 777 7777',
            level: 1,
            parentReferralId: null,
            commissionRate: 5,
            dateAdded: '2025-01-22',
            totalSales: 3200,
            commissionsEarned: 160
        },
        {
            parentAgentId: 'GHA-111111111-1',
            referralId: 'GHA-888888888-8',
            referralName: 'Grace Mensah',
            phone: '+233 24 888 8888',
            level: 2,
            parentReferralId: 'GHA-666666666-6', // Under Sarah
            commissionRate: 2.5,
            dateAdded: '2025-01-25',
            totalSales: 1800,
            commissionsEarned: 45
        },
        {
            parentAgentId: 'GHA-111111111-1',
            referralId: 'GHA-999999999-9',
            referralName: 'Joseph Tetteh',
            phone: '+233 24 999 9999',
            level: 2,
            parentReferralId: 'GHA-666666666-6', // Under Sarah
            commissionRate: 2.5,
            dateAdded: '2025-01-27',
            totalSales: 2100,
            commissionsEarned: 52.5
        },
        
        // Ama's network (GHA-222222222-2)
        {
            parentAgentId: 'GHA-222222222-2',
            referralId: 'GHA-101010101-0',
            referralName: 'Emmanuel Nkrumah',
            phone: '+233 24 101 0101',
            level: 1,
            parentReferralId: null,
            commissionRate: 5,
            dateAdded: '2025-01-18',
            totalSales: 4500,
            commissionsEarned: 225
        },
        {
            parentAgentId: 'GHA-222222222-2',
            referralId: 'GHA-121212121-1',
            referralName: 'Abena Serwaa',
            phone: '+233 24 121 2121',
            level: 1,
            parentReferralId: null,
            commissionRate: 5,
            dateAdded: '2025-01-19',
            totalSales: 3800,
            commissionsEarned: 190
        },
        {
            parentAgentId: 'GHA-222222222-2',
            referralId: 'GHA-131313131-3',
            referralName: 'Daniel Ansah',
            phone: '+233 24 131 3131',
            level: 2,
            parentReferralId: 'GHA-101010101-0', // Under Emmanuel
            commissionRate: 2.5,
            dateAdded: '2025-01-28',
            totalSales: 2800,
            commissionsEarned: 70
        },
        
        // Kofi's network (GHA-333333333-3)
        {
            parentAgentId: 'GHA-333333333-3',
            referralId: 'GHA-141414141-4',
            referralName: 'Joyce Ofori',
            phone: '+233 24 141 4141',
            level: 1,
            parentReferralId: null,
            commissionRate: 5,
            dateAdded: '2025-01-21',
            totalSales: 5200,
            commissionsEarned: 260
        },
        {
            parentAgentId: 'GHA-333333333-3',
            referralId: 'GHA-151515151-5',
            referralName: 'Peter Quaye',
            phone: '+233 24 151 5151',
            level: 2,
            parentReferralId: 'GHA-141414141-4', // Under Joyce
            commissionRate: 2.5,
            dateAdded: '2025-01-29',
            totalSales: 1500,
            commissionsEarned: 37.5
        },
        {
            parentAgentId: 'GHA-333333333-3',
            referralId: 'GHA-161616161-6',
            referralName: 'Rebecca Amoah',
            phone: '+233 24 161 6161',
            level: 2,
            parentReferralId: 'GHA-141414141-4', // Under Joyce
            commissionRate: 2.5,
            dateAdded: '2025-01-30',
            totalSales: 1900,
            commissionsEarned: 47.5
        }
    ],
    
    commissionTransactions: [
        { agentId: 'GHA-111111111-1', referralId: 'GHA-666666666-6', date: '2025-01-20', amount: 2500, commission: 125, level: 1 },
        { agentId: 'GHA-111111111-1', referralId: 'GHA-777777777-7', date: '2025-01-22', amount: 3200, commission: 160, level: 1 },
        { agentId: 'GHA-111111111-1', referralId: 'GHA-888888888-8', date: '2025-01-25', amount: 1800, commission: 45, level: 2 },
        { agentId: 'GHA-111111111-1', referralId: 'GHA-999999999-9', date: '2025-01-27', amount: 2100, commission: 52.5, level: 2 },
        { agentId: 'GHA-222222222-2', referralId: 'GHA-101010101-0', date: '2025-01-18', amount: 4500, commission: 225, level: 1 },
        { agentId: 'GHA-222222222-2', referralId: 'GHA-121212121-1', date: '2025-01-19', amount: 3800, commission: 190, level: 1 },
        { agentId: 'GHA-222222222-2', referralId: 'GHA-131313131-3', date: '2025-01-28', amount: 2800, commission: 70, level: 2 },
        { agentId: 'GHA-333333333-3', referralId: 'GHA-141414141-4', date: '2025-01-21', amount: 5200, commission: 260, level: 1 },
        { agentId: 'GHA-333333333-3', referralId: 'GHA-151515151-5', date: '2025-01-29', amount: 1500, commission: 37.5, level: 2 },
        { agentId: 'GHA-333333333-3', referralId: 'GHA-161616161-6', date: '2025-01-30', amount: 1900, commission: 47.5, level: 2 }
    ]
};

// Helper functions
function getAgentReferrals(agentId) {
    return demoData.referrals.filter(r => r.parentAgentId === agentId);
}

function getLevel1Referrals(agentId) {
    return demoData.referrals.filter(r => r.parentAgentId === agentId && r.level === 1);
}

function getLevel2Referrals(agentId) {
    return demoData.referrals.filter(r => r.parentAgentId === agentId && r.level === 2);
}

function getAgentTotalCommission(agentId) {
    const referrals = getAgentReferrals(agentId);
    return referrals.reduce((sum, r) => sum + r.commissionsEarned, 0);
}

function getAgentByIdIndex(agentId) {
    return demoData.agents.findIndex(a => a.id === agentId);
}

function getReferralById(referralId) {
    return demoData.referrals.find(r => r.referralId === referralId);
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = demoData;
}
