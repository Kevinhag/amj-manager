<script>
</script>

<div class="report-page">
	{@html report}
	<div class="report-content">
		<h1>Relatório</h1>
		<div class="report-details">
			<p>Data: {new Date().toLocaleDateString()}</p>
			<p>Total: {total}</p>
		</div>
		<div class="report-items">
			{#each items as item}
				<div class="report-item">
					<span>{item.name}</span>
					<span>{item.quantity}</span>
					<span>{item.price}</span>
				</div>
			{/each}
		</div>
	</div>
</div>