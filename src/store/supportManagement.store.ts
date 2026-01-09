// src/store/supportManagement.store.ts
import { Module } from 'vuex';

type Ticket = {
    id: string;
    code: string;
    title: string;
    description?: string;
    status: string;
    severity: string;
    department?: string;
    createdAt: string;
    dueAt: string;
    comments?: any[];
    attachments?: any[];
};

const makeId = (n = 6) => Math.random().toString(36).slice(2, 2 + n).toUpperCase();

function seedTickets(count = 20) {
    const severities = ['LOW', 'MEDIUM', 'HIGH', 'SPECIAL'];
    const statuses = ['DRAFT', 'SUBMITTED', 'PENDING_DEPT', 'PENDING_LEADER', 'APPROVED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    const depts = ['Administration', 'Internal Medicine', 'Surgery', 'Accounting', 'IT'];
    const tickets: Ticket[] = [];
    for (let i = 0; i < count; i++) {
        const s = severities[i % severities.length];
        const st = statuses[i % statuses.length];
        const created = new Date(Date.now() - (i * 3600 * 1000 * 24));
        const due = new Date(created.getTime() + (3 + (i % 7)) * 24 * 3600 * 1000);
        tickets.push({
            id: makeId(8),
            code: `REQ-${1000 + i}`,
            title: `Support request #${i + 1}`,
            description: `Sample description for support request #${i + 1}`,
            status: st,
            severity: s,
            department: depts[i % depts.length],
            createdAt: created.toISOString(),
            dueAt: due.toISOString(),
            comments: [],
            attachments: [],
        });
    }
    return tickets;
}

const supportModule: Module<any, any> = {
    namespaced: true,
    state: () => ({
        allTickets: seedTickets(20),
        tickets: [] as Ticket[],
        currentTicket: null,
        loading: false,
        filter: { status: 'ALL', severity: 'ALL', keyword: '' },
        role: 'admin',
    }),
    mutations: {
        setTickets(state: any, tickets: Ticket[]) { state.tickets = tickets; },
        addAllTicket(state: any, t: Ticket) { state.allTickets.unshift(t); state.tickets.unshift(t); },
        setLoading(state: any, v: boolean) { state.loading = !!v; },
        setCurrentTicket(state: any, t: Ticket | null) { state.currentTicket = t; },
        setFilter(state: any, f: any) { state.filter = f || { status: 'ALL', severity: 'ALL', keyword: '' }; },
        setRole(state: any, r: string) { state.role = r; },
        addTicket(state: any, t: Ticket) { state.tickets.unshift(t); },
        updateTicket(state: any, t: Ticket) {
            const idx = state.tickets.findIndex((x: Ticket) => x.id === t.id);
            if (idx >= 0) state.tickets.splice(idx, 1, { ...state.tickets[idx], ...t });
            const idxAll = state.allTickets.findIndex((x: Ticket) => x.id === t.id);
            if (idxAll >= 0) state.allTickets.splice(idxAll, 1, { ...state.allTickets[idxAll], ...t });
        },
    },
    getters: {
        counts(state: any) {
            const total = (state.tickets || []).length;
            const waiting = (state.tickets || []).filter((t: Ticket) => ['PENDING_DEPT', 'PENDING_LEADER', 'PENDING_BOD'].includes(t.status)).length;
            const inProgress = (state.tickets || []).filter((t: Ticket) => t.status === 'IN_PROGRESS').length;
            const done = (state.tickets || []).filter((t: Ticket) => ['RESOLVED', 'CLOSED'].includes(t.status)).length;
            return { total, waiting, inProgress, done };
        }
    },
    actions: {
        fetchTickets({ state, commit }: any, filter?: any) {
            commit('setLoading', true);
            return new Promise((resolve) => {
                setTimeout(() => {
                    const f = filter || state.filter || { status: 'ALL', severity: 'ALL', keyword: '' };
                    let list = [...state.allTickets];
                    if (f.status && f.status !== 'ALL') list = list.filter((t: Ticket) => t.status === f.status);
                    if (f.severity && f.severity !== 'ALL') list = list.filter((t: Ticket) => t.severity === f.severity);
                    if (f.keyword) list = list.filter((t: Ticket) => (t.title || '').toLowerCase().includes((f.keyword || '').toLowerCase()));
                    commit('setTickets', list);
                    commit('setLoading', false);
                    resolve(list);
                }, 120);
            });
        },
        getTicket({ state, commit }: any, id: string) {
            return new Promise((resolve) => {
                const t = state.tickets.find((x: Ticket) => x.id === id) || null;
                commit('setCurrentTicket', t);
                resolve(t);
            });
        },
        createTicket({ commit }: any, payload: any) {
            return new Promise((resolve) => {
                const t: Ticket = { id: makeId(8), code: `REQ-${Math.floor(Math.random() * 9000) + 1000}`, title: payload.title || 'No title', description: payload.description || '', status: 'DRAFT', severity: payload.severity || 'LOW', department: payload.department || '', createdAt: new Date().toISOString(), dueAt: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(), comments: [], attachments: [] };
                commit('addAllTicket', t);
                resolve(t);
            });
        },
        submitTicket({ commit }: any, id: string) {
            return new Promise((resolve, reject) => {
                // simple state transition
                setTimeout(() => {
                    // find and update
                    commit('setLoading', false);
                    resolve(true);
                }, 100);
            });
        },
        approveTicket({ commit }: any, { id, approver }: any) {
            return new Promise((resolve) => {
                const t = null; // placeholder
                commit('setLoading', false);
                resolve(true);
            });
        },
        addComment({ state, commit, rootState }: any, { id, comment, author }: any) {
            return new Promise((resolve, reject) => {
                // find ticket and add comment using rootState to access the master list
                const idx = rootState.support.tickets.findIndex((x: Ticket) => x.id === id);
                if (idx >= 0) {
                    rootState.support.tickets[idx].comments = rootState.support.tickets[idx].comments || [];
                    const c = { id: makeId(6), message: comment, author: author || 'web_user', createdAt: new Date().toISOString() };
                    rootState.support.tickets[idx].comments.push(c);
                    commit('updateTicket', rootState.support.tickets[idx]);
                    resolve(c);
                } else reject(new Error('Ticket not found'));
            });
        },
        updateTicket({ commit }: any, payload: any) {
            commit('updateTicket', payload);
            return Promise.resolve(payload);
        },
        exportCsv({ state }: any, filter?: any) {
            return new Promise((resolve) => {
                const rows = state.tickets.map((t: Ticket) => `${t.code},"${t.title}",${t.severity},${t.status},${t.department},${t.createdAt}\n`).join('');
                resolve('code,title,severity,status,department,createdAt\n' + rows);
            });
        },
    }
};

export default supportModule;
