<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let items = [];

	onMount(() => {
		fetch('http://localhost:3000/api/data')
			.then((response) => response.json())
			.then((data) => {
				items = data;
				console.log(data);
			});
	});
</script>

<h1>Itens do Banco de Dados</h1>

{#if items.length === 0}
	<p>Nenhum item encontrado.</p>
{:else}
	<ul>
		{#each items as item (item.id)}
			<li>{item.nome}</li>
		{/each}
	</ul>
{/if}
