<script lang="ts">
	type MarkerThemeLegendItem = {
		label: string;
		color: string;
		isOil: boolean;
		isCurrency: boolean;
		isDevelopedStocks: boolean;
		isEmergingStocks: boolean;
		isRealEstate: boolean;
		isPolicy: boolean;
		isBond: boolean;
		isCommodity: boolean;
		isEvents: boolean;
		isGold: boolean;
	};

	let { items = [] } = $props<{ items?: MarkerThemeLegendItem[] }>();
</script>

{#if items.length > 0}
	<section class="map-legend" aria-label="Map marker legend">
		<p class="map-legend-title">Color legend</p>
		<div class="map-legend-list">
			{#each items as item}
				<div class="map-legend-item">
					{#if item.isOil}
						<svg class="map-legend-oil-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" aria-hidden="true">
							<path fill={item.color} d="M160-120q-17 0-28.5-11.5T120-160q0-17 11.5-28.5T160-200h40v-240h-40q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520h40v-240h-40q-17 0-28.5-11.5T120-800q0-17 11.5-28.5T160-840h640q17 0 28.5 11.5T840-800q0 17-11.5 28.5T800-760h-40v240h40q17 0 28.5 11.5T840-480q0 17-11.5 28.5T800-440h-40v240h40q17 0 28.5 11.5T840-160q0 17-11.5 28.5T800-120H160Zm120-80h400v-240q-17 0-28.5-11.5T640-480q0-17 11.5-28.5T680-520v-240H280v240q17 0 28.5 11.5T320-480q0 17-11.5 28.5T280-440v240Zm285-154.5q35-34.5 35-83.5 0-39-22.5-67T480-620q-75 86-97.5 114.5T360-438q0 49 35 83.5t85 34.5q50 0 85-34.5ZM280-200v-560 560Z"/>
						</svg>
					{:else if item.isCurrency}
						<svg class="map-legend-currency-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" aria-hidden="true">
							<path fill={item.color} d="M600-320h160v-160h-60v100H600v60Zm-120-40q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM200-480h60v-100h100v-60H200v160ZM80-200v-560h800v560H80Zm80-80h640v-400H160v400Zm0 0v-400 400Z"/>
						</svg>
					{:else if item.isDevelopedStocks || item.isEmergingStocks}
						<svg class="map-legend-stocks-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" aria-hidden="true">
							<path fill={item.color} d="M200-280v-280h80v280h-80Zm240 0v-280h80v280h-80ZM80-120v-80h800v80H80Zm600-160v-280h80v280h-80ZM80-640v-80l400-200 400 200v80H80Zm178-80h444-444Zm0 0h444L480-830 258-720Z"/>
						</svg>
					{:else if item.isRealEstate}
						<svg class="map-legend-real-estate-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" aria-hidden="true">
							<path fill={item.color} d="M120-120v-560h160v-160h400v320h160v400H520v-160h-80v160H120Zm80-80h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm160 160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm160 320h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm160 480h80v-80h-80v80Zm0-160h80v-80h-80v80Z"/>
						</svg>
					{:else if item.isPolicy}
						<svg class="map-legend-policy-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" aria-hidden="true">
							<path fill={item.color} d="M160-120v-80h480v80H160Zm226-194L160-540l84-86 228 226-86 86Zm254-254L414-796l86-84 226 226-86 86Zm184 408L302-682l56-56 522 522-56 56Z"/>
						</svg>
					{:else if item.isBond}
						<svg class="map-legend-bond-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" aria-hidden="true">
							<path fill={item.color} d="M336-120q-91 0-153.5-62.5T120-336q0-38 13-74t37-65l142-171-97-194h530l-97 194 142 171q24 29 37 65t13 74q0 91-63 153.5T624-120H336Zm144-200q-33 0-56.5-23.5T400-400q0-33 23.5-56.5T480-480q33 0 56.5 23.5T560-400q0 33-23.5 56.5T480-320Zm-95-360h190l40-80H345l40 80Zm-49 480h288q57 0 96.5-39.5T760-336q0-24-8.5-46.5T728-423L581-600H380L232-424q-15 18-23.5 41t-8.5 47q0 57 39.5 96.5T336-200Z"/>
						</svg>
					{:else if item.isCommodity}
						<svg class="map-legend-commodity-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" aria-hidden="true">
							<path fill={item.color} d="M480-120 80-600l120-240h560l120 240-400 480Zm-95-520h190l-60-120h-70l-60 120Zm55 347v-267H218l222 267Zm80 0 222-267H520v267Zm144-347h106l-60-120H604l60 120Zm-474 0h106l60-120H250l-60 120Z"/>
						</svg>
					{:else if item.isEvents}
						<svg class="map-legend-events-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" aria-hidden="true">
							<path fill={item.color} d="m480-281 59-59h81v-81l59-59-59-59v-81h-81l-59-59-59 59h-81v81l-59 59 59 59v81h81l59 59Zm0 253L346-160H160v-186L28-480l132-134v-186h186l134-132 134 132h186v186l132 134-132 134v186H614L480-28Zm0-112 100-100h140v-140l100-100-100-100v-140H580L480-820 380-720H240v140L140-480l100 100v140h140l100 100Zm0-340Z"/>
						</svg>
					{:else if item.isGold}
						<svg class="map-legend-gold-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" aria-hidden="true">
							<path fill={item.color} d="M852-212 732-332l56-56 120 120-56 56ZM708-692l-56-56 120-120 56 56-120 120Zm-456 0L132-812l56-56 120 120-56 56ZM108-212l-56-56 120-120 56 56-120 120Zm246-75 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143ZM233-120l65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-361Z"/>
						</svg>
					{:else}
						<span class="map-legend-color" style={`background-color:${item.color}`} aria-hidden="true"></span>
					{/if}
					<span class="map-legend-label">{item.label}</span>
				</div>
			{/each}
		</div>
	</section>
{/if}

<style>
	.map-legend {
		position: absolute;
		left: 1rem;
		bottom: calc(var(--globe-banner-offset) + var(--globe-banner-safe-bottom));
		z-index: 520;
		padding: 0.52rem 0.62rem;
		border-radius: 0.56rem;
		border: 1px solid #2f4254;
		background: linear-gradient(160deg, #0b121bcf, #132130b8);
		backdrop-filter: blur(10px);
		box-shadow: 0 10px 26px #01060d88;
		pointer-events: none;
		max-width: min(21rem, 42vw);
	}

	.map-legend-title {
		margin: 0 0 0.34rem;
		font: 600 0.68rem/1 'IBM Plex Mono', monospace;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #dce7f4;
	}

	.map-legend-list {
		display: grid;
		gap: 0.26rem;
	}

	.map-legend-item {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		min-width: 0;
	}

	.map-legend-color {
		width: 0.64rem;
		height: 0.64rem;
		border-radius: 999px;
		flex: 0 0 auto;
		border: 1px solid #ffffff3d;
	}

	.map-legend-oil-icon,
	.map-legend-currency-icon,
	.map-legend-stocks-icon,
	.map-legend-real-estate-icon,
	.map-legend-policy-icon,
	.map-legend-bond-icon,
	.map-legend-commodity-icon,
	.map-legend-events-icon,
	.map-legend-gold-icon {
		width: 0.9rem;
		height: 0.9rem;
		flex: 0 0 auto;
	}

	.map-legend-label {
		font: 500 0.72rem/1.2 'IBM Plex Sans', sans-serif;
		color: #cfddea;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	@media (max-width: 680px) {
		.map-legend {
			left: 0.75rem;
			bottom: calc(var(--globe-banner-offset) + var(--globe-banner-safe-bottom));
			max-width: min(16rem, 60vw);
		}
	}
</style>
