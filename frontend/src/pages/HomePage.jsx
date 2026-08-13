import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi, categoriesApi } from '../api/products';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';

const PAGE_SIZE = 12;

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const page = Number(searchParams.get('page') || 1);

  const [searchText, setSearchText] = useState(q);

  useEffect(() => {
    setSearchText(q);
  }, [q]);

  useEffect(() => {
    categoriesApi
      .list()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (q) params.q = q;
      if (category) params.category = category;
      const result = await productsApi.list(params);
      setProducts(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [q, category, page]);

  useEffect(() => {
    load();
  }, [load]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <div className="container">
      <section className="hero">
        <h1>Shop the everyday essentials</h1>
        <p>Free shipping over $50 on US orders. Demo catalog for the ShopFlow platform.</p>
      </section>

      <div className="toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Search products…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updateParam('q', e.target.value.trim());
          }}
        />
        <select
          className="select"
          value={category}
          onChange={(e) => updateParam('category', e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {!products.length && <p className="empty">No products found. Try a different search.</p>}

          {meta && meta.totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={page <= 1}
                onClick={() => updateParam('page', String(page - 1))}
              >
                Previous
              </button>
              <span>
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={page >= meta.totalPages}
                onClick={() => updateParam('page', String(page + 1))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
