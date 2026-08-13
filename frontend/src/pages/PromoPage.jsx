import "../styles/PromoPage.css";

import { useState, useEffect } from 'react';
export default function PromoPage() {
	const [promos, setPromos] = useState({
		"data": []
	})

	useEffect(() => {
		fetch('http://localhost:4000/api/v1/promos')
		    .then(res => { return res.json() })
		    .then(data => 
		    	setPromos(data)
		    );
	}, [])

	return (
		<div className="promo-page">
			<div className="promo-header">
				<h1>Promo</h1>
				<p>Temukan berbagai promo menarik untuk kamu</p>
			</div>

			<div className="promo-grid">
				{promos.data.map((promo) => (
					<div className="promo-card" key={promo.id}>
						<div className="promo-card-content">
							<span className="promo-label">PROMO</span>

							<h2>{promo.name}</h2>

							<p>{promo.description}</p>

							<button className="promo-button">
								Lihat Promo
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}