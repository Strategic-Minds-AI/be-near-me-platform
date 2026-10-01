import { getSupabase } from "@/lib/supabaseClient";

// ─────────────────────────────────────────────────────────────────────────
// Supabase-backed entity client that mimics the Base44 entity API surface
// (filter/get/create/update/delete/list/count/bulkCreate/subscribe/...).
// MongoDB-style query operators are translated to PostgREST filters.
// ─────────────────────────────────────────────────────────────────────────

async function table(name) {
  const sb = await getSupabase();
  if (!sb) throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in src/lib/config.js");
  return sb.from(name);
}

// Translate a MongoDB-style filter object into PostgREST chain calls.
function applyFilter(query, filter) {
  if (!filter || typeof filter !== "object") return query;
  for (const [key, value] of Object.entries(filter)) {
    if (key === "$or") {
      // $or: [ {a:1}, {b:2} ] -> "a=eq.1,b=eq.2"
      const parts = value.map((clause) => {
        const entries = Object.entries(clause);
        return entries.map(([k, v]) => buildExpr(k, v)).filter(Boolean).join(",");
      }).filter(Boolean);
      if (parts.length) query = query.or(parts.join(","));
      continue;
    }
    if (key === "$and") {
      for (const clause of value) query = applyFilter(query, clause);
      continue;
    }
    query = applyExpr(query, key, value);
  }
  return query;
}

function buildExpr(key, value) {
  if (value === null || value === undefined) return `${key}=is.null`;
  if (typeof value === "object" && !Array.isArray(value)) {
    const ops = [];
    for (const [op, opVal] of Object.entries(value)) {
      switch (op) {
        case "$eq": ops.push(`${key}=eq.${opVal}`); break;
        case "$ne": ops.push(`${key}=neq.${opVal}`); break;
        case "$gt": ops.push(`${key}=gt.${opVal}`); break;
        case "$gte": ops.push(`${key}=gte.${opVal}`); break;
        case "$lt": ops.push(`${key}=lt.${opVal}`); break;
        case "$lte": ops.push(`${key}=lte.${opVal}`); break;
        case "$in": ops.push(`${key}=in.(${opVal.join(",")})`); break;
        case "$nin": ops.push(`${key}=not.in.(${opVal.join(",")})`); break;
        case "$exists":
          ops.push(opVal ? `${key}=not.is.null` : `${key}=is.null`); break;
        case "$regex": {
          // Convert ^prefix / prefix$ / contains to ilike patterns
          let p = opVal;
          if (p.startsWith("^")) p = p.slice(1).replace(/\$$/, "") + "%";
          else if (p.endsWith("$")) p = "%" + p.slice(0, -1);
          else p = "%" + p + "%";
          const opt = value.$options?.includes("i") ? "ilike" : "like";
          ops.push(`${key}=${opt}.${p}`);
          break;
        }
        default: break;
      }
    }
    return ops.join(",");
  }
  // plain equality
  return `${key}=eq.${value}`;
}

function applyExpr(query, key, value) {
  if (value === null || value === undefined) return query.is(key, null);
  if (typeof value === "object" && !Array.isArray(value)) {
    for (const [op, opVal] of Object.entries(value)) {
      switch (op) {
        case "$eq": query = query.eq(key, opVal); break;
        case "$ne": query = query.neq(key, opVal); break;
        case "$gt": query = query.gt(key, opVal); break;
        case "$gte": query = query.gte(key, opVal); break;
        case "$lt": query = query.lt(key, opVal); break;
        case "$lte": query = query.lte(key, opVal); break;
        case "$in": query = query.in(key, opVal); break;
        case "$nin": query = query.not(key, "in", opVal); break;
        case "$exists": query = opVal ? query.not(key, "is", null) : query.is(key, null); break;
        case "$regex": {
          let p = opVal;
          if (p.startsWith("^")) p = p.slice(1).replace(/\$$/, "") + "%";
          else if (p.endsWith("$")) p = "%" + p.slice(0, -1);
          else p = "%" + p + "%";
          const opt = value.$options?.includes("i") ? "ilike" : "like";
          query = query[opt](key, p);
          break;
        }
        default: break;
      }
    }
    return query;
  }
  return query.eq(key, value);
}

function applySort(query, sort) {
  if (!sort) return query;
  const cols = Array.isArray(sort) ? sort : [sort];
  for (const col of cols) {
    const desc = col.startsWith("-");
    const name = desc ? col.slice(1) : col;
    query = query.order(name, { ascending: !desc });
  }
  return query;
}

function pick(record, fields) {
  if (!fields || !fields.length) return record;
  const out = { id: record.id };
  for (const f of fields) if (f in record) out[f] = record[f];
  return out;
}

// Factory: returns an entity client for one Supabase table.
export function supabaseEntity(tableName) {
  const api = {
    async filter(query = {}, { sort, limit = 50, fields, cursor } = {}) {
      let q = (await table(tableName)).select(fields ? fields.join(",") : "*", { count: undefined });
      q = applyFilter(q, query);
      q = applySort(q, sort);
      // cursor is an offset number for simple pagination
      const offset = typeof cursor === "number" ? cursor : 0;
      if (offset) q = q.range(offset, offset + limit - 1);
      else q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw new Error(`filter ${tableName}: ${error.message}`);
      const items = (data || []).map((r) => pick(r, fields));
      const next_offset = offset + items.length;
      return { items, next_cursor: items.length === limit ? next_offset : null, has_more: items.length === limit };
    },

    async get(id, { fields } = {}) {
      let q = (await table(tableName)).select(fields ? fields.join(",") : "*").eq("id", id).limit(1);
      const { data, error } = await q;
      if (error) throw new Error(`get ${tableName}: ${error.message}`);
      return data && data[0] ? pick(data[0], fields) : null;
    },

    async create(data) {
      const { data: row, error } = await (await table(tableName)).insert(data).select().single();
      if (error) throw new Error(`create ${tableName}: ${error.message}`);
      return row;
    },

    async bulkCreate(records) {
      const { data: rows, error } = await (await table(tableName)).insert(records).select();
      if (error) throw new Error(`bulkCreate ${tableName}: ${error.message}`);
      return rows || [];
    },

    async update(id, data) {
      const { data: row, error } = await (await table(tableName)).update(data).eq("id", id).select().single();
      if (error) throw new Error(`update ${tableName}: ${error.message}`);
      return row;
    },

    async bulkUpdate(records) {
      // Supabase has no single-call bulk update; do sequential (fine for <500)
      const out = [];
      for (const r of records) {
        const { id, ...rest } = r;
        const { data: row, error } = await (await table(tableName)).update(rest).eq("id", id).select().single();
        if (error) throw new Error(`bulkUpdate ${tableName}: ${error.message}`);
        out.push(row);
      }
      return out;
    },

    async updateMany(query, update) {
      // $set only for now
      const set = update.$set || {};
      const { data, error } = await (await table(tableName)).update(set).match(flattenMatch(query)).select();
      if (error) throw new Error(`updateMany ${tableName}: ${error.message}`);
      return { count: (data || []).length, has_more: false };
    },

    async delete(id) {
      const { error } = await (await table(tableName)).delete().eq("id", id);
      if (error) throw new Error(`delete ${tableName}: ${error.message}`);
      return { id };
    },

    async deleteMany(query) {
      const { data, error } = await (await table(tableName)).delete().match(flattenMatch(query)).select();
      if (error) throw new Error(`deleteMany ${tableName}: ${error.message}`);
      return { count: (data || []).length };
    },

    async list({ sort, limit = 50, distinct, fields, cursor } = {}) {
      if (distinct) {
        const col = typeof distinct === "string" ? distinct : distinct;
        const { data, error } = await (await table(tableName)).select(col);
        if (error) throw new Error(`list distinct ${tableName}: ${error.message}`);
        const seen = new Set();
        const items = [];
        for (const r of data || []) {
          const v = r[col];
          if (!seen.has(v)) { seen.add(v); items.push(v); }
          if (items.length >= limit) break;
        }
        return { items, next_cursor: null, has_more: false };
      }
      return api.filter({}, { sort, limit, fields, cursor });
    },

    async count(query = {}) {
      let q = (await table(tableName)).select("*", { count: "exact", head: true });
      q = applyFilter(q, query);
      const { count, error } = await q;
      if (error) throw new Error(`count ${tableName}: ${error.message}`);
      return count || 0;
    },

    async aggregate({ query, groupBy, sum, avg, min, max, sort, limit = 1000 } = {}) {
      // Best-effort: fetch matching rows and group in JS. Fine for small/medium
      // tables; for large tables move to a Supabase RPC/SQL view.
      let q = (await table(tableName)).select("*");
      q = applyFilter(q, query);
      q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw new Error(`aggregate ${tableName}: ${error.message}`);
      const groups = new Map();
      for (const row of data || []) {
        const key = groupBy ? row[groupBy] : "_all";
        if (!groups.has(key)) groups.set(key, { count: 0 });
        const g = groups.get(key);
        g.count++;
        for (const s of [].concat(sum || [])) g[`sum_${s}`] = (g[`sum_${s}`] || 0) + Number(row[s] || 0);
        for (const a of [].concat(avg || [])) { g[`avg_${a}`] = (g[`avg_${a}`] || 0) + Number(row[a] || 0); }
        for (const mn of [].concat(min || [])) g[`min_${mn}`] = Math.min(g[`min_${mn}`] ?? Infinity, Number(row[mn] || 0));
        for (const mx of [].concat(max || [])) g[`max_${mx}`] = Math.max(g[`max_${mx}`] ?? -Infinity, Number(row[mx] || 0));
      }
      let rows = [...groups.entries()].map(([k, v]) => {
        const r = groupBy ? { [groupBy]: k } : {};
        for (const a of [].concat(avg || [])) if (v.count) r[`avg_${a}`] = v[`avg_${a}`] / v.count;
        return { ...r, count: v.count, ...v };
      });
      if (sort) {
        const desc = sort.startsWith("-");
        const col = desc ? sort.slice(1) : sort;
        rows.sort((a, b) => (a[col] > b[col] ? 1 : -1) * (desc ? -1 : 1));
      }
      return { rows, truncated: false };
    },

    async upsert(records, { key = "id" } = {}) {
      const { data, error } = await (await table(tableName)).upsert(records, { onConflict: key }).select();
      if (error) throw new Error(`upsert ${tableName}: ${error.message}`);
      return { created: (data || []).length, updated: 0, records: data || [] };
    },

    subscribe(callback) {
      let channel = null;
      let removed = false;
      const sbPromise = getSupabase();
      sbPromise.then((sb) => {
        if (!sb || removed) return;
        channel = sb.channel(`realtime:${tableName}`)
          .on("postgres_changes", { event: "*", schema: "public", table: tableName }, (payload) => {
            const type = payload.eventType === "INSERT" ? "create"
              : payload.eventType === "UPDATE" ? "update"
              : payload.eventType === "DELETE" ? "delete" : "update";
            callback({ id: payload.new?.id || payload.old?.id, type, data: payload.new || payload.old });
          })
          .subscribe();
      });
      return () => {
        removed = true;
        if (channel) sbPromise.then((sb) => sb && sb.removeChannel(channel));
      };
    },
  };

  return api;
}

// Flatten a simple equality filter to a Supabase match() object (used by
// updateMany/deleteMany). Only handles top-level equality; complex filters
// are ignored (caller should pass a simple query).
function flattenMatch(query) {
  const out = {};
  for (const [k, v] of Object.entries(query || {})) {
    if (k.startsWith("$")) continue;
    if (v === null || v === undefined || typeof v === "object") continue;
    out[k] = v;
  }
  return out;
}

// Proxy that returns a supabaseEntity for any table name accessed.
export const supabaseEntities = new Proxy({}, {
  get: (_target, name) => supabaseEntity(String(name)),
});