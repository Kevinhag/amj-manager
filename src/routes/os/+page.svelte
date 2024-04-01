<script>
	import { onMount } from 'svelte';
	import Reorderable from '$lib/Reorderable.svelte';

	let parts = [];
	let cars = [];
	let clients = [];

	let mainInfo = 'Gerar Ordem de Serviço';

	let addedParts = [];

	let selectedPart = '';
	let selectedPartData = '';

	let selectedCar = '';
	let selectedCarData = '';

	let selectedClient;
	let selectedClientData;

	let searchQuery = '';
	let searchPartQuery = '';

	onMount(() => {
		fetch('http://localhost:3000/api/cars')
			.then((response) => response.json())
			.then((data) => {
				cars = data;
				console.log(data);
			});

		fetch('http://localhost:3000/api/parts')
			.then((response) => response.json())
			.then((data) => {
				parts = data;
				console.log(data);
			});

		fetch('http://localhost:3000/api/clients')
			.then((response) => response.json())
			.then((data) => {
				clients = data;
				console.log(data);
			});
	});

	function addPartList() {
		addedParts.push(selectedPart);
		console.log(addedParts);
		addedParts = addedParts;
	}

	function handleClientSearch(event) {
		searchQuery = event.target.value.toLowerCase();
	}

	function handlePartSearch(event) {
		searchPartQuery = event.target.value.toLowerCase();
	}

	$: selectedPartData = parts.find((part) => part.id == selectedPart);
	$: selectedCarData = cars.find((car) => car.id == selectedCar);
	$: selectedClientData = clients.find((client) => client.id == selectedClient);
	$: filteredClients = clients.filter(
		(client) =>
			client.nome.toLowerCase().includes(searchQuery) ||
			client.cpf.toLowerCase().includes(searchQuery),
	);
	$: filteredParts = parts.filter(
		(part) =>
			part.nome.toLowerCase().includes(searchPartQuery) ||
			part.marca.toLowerCase().includes(searchPartQuery),
	);
</script>

<main>
	<h1>{mainInfo}</h1>
	<section>
		<div>
			<div class="form person2">
				Pesquisar Cliente:
				<input type="text" id="search" on:input={handleClientSearch} />

				Clientes:
				<select name="clients" id="clients" size="5" bind:value={selectedClient}>
					{#if clients.length === 0}
						<p>Nenhum item encontrado</p>
					{:else}
						{#each filteredClients as client (client.id)}
							<option value={client.id}>{client.nome} - {client.cpf}</option>
						{/each}
					{/if}
				</select>
				<div class="form-client">
					{#if selectedClientData}
						<h3>Cliente</h3>
						<p>Nome: {selectedClientData.nome}</p>
						<p>CPF: {selectedClientData.cpf}</p>
						<p>Telefone: {selectedClientData.tel}</p>
						<p>Cidade: {selectedClientData.cidade}</p>
					{:else}
						<h3>Nenhum Cliente Selecionado.</h3>
					{/if}
				</div>
			</div>
			<div class="cars-list">
				<select name="cars" id="cars" size="3" bind:value={selectedCar}>
					{#each cars.filter((car) => car.cliente_id == selectedClient) as car (car.id)}
						<option value={car.id}>
							{car.marca +
								'\xa0'.repeat(15 - car.marca.length) +
								'\xa0'.repeat(5) +
								car.modelo +
								'\xa0'.repeat(15 - car.modelo.length) +
								car.placa +
								'\xa0'.repeat(15 - car.marca.length)}
						</option>
					{/each}
				</select>
				<div class="form-car">
					{#if selectedCarData}
						<p>Marca: {selectedCarData.marca}</p>
						<p>Modelo: {selectedCarData.modelo}</p>
						<p>Placa: {selectedCarData.ano}</p>
						<p>Placa: {selectedCarData.ano}</p>
						<p>Placa: {selectedCarData.placa}</p>
						{#if selectedCarData.obsretifica}
							<p>Placa: {selectedCarData.observacao}</p>
						{/if}
					{/if}
				</div>
			</div>
		</div>
		<div>
			<div class="part-list">
				Pesquisar Peças:
				<input type="text" id="search" on:input={handlePartSearch} />

				<select name="parts" id="parts" size="10" bind:value={selectedPart}>
					{#each filteredParts as part (part.id)}
						<option value={part.id}>
							{part.marca}&nbsp;&nbsp; - &nbsp;&nbsp;{part.nome}
						</option>
					{/each}
				</select>
				<button class="add-part" on:click={addPartList}>Adicionar Peça</button>
			</div>
			<div>services</div>
		</div>
		<div>
			<div class="os">
				<h3>Ordem de Serviço</h3>

				<!-- {#if selectedPartData}
					<p>{selectedPartData.marca}</p>
					<p>{selectedPartData.nome}</p>
					<p>{selectedPartData.valor}</p>
				{/if} -->
				<Reorderable
					bind:list={addedParts}
					update={(value) => {
						addedParts = value;
						console.log(value);
					}}
				/>

				{#if addedParts}
					<h3>Peças adicionadas</h3>
					{#each addedParts as part}
						<p>{part}</p>
					{/each}
				{/if}
			</div>
		</div>
	</section>
</main>

<style lang="scss">
	section {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		gap: 1rem;
		width: 100%;
		height: 100%;
		background-color: $colora;
	}

	.text {
		padding: 0px 5px 0px 10px;
		border-radius: 5px;
		font-size: 1.5rem;
		font-weight: bold;
		background-color: $darker;
		width: 15px;
	}
	.form-client {
		background-color: $darker;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		border: 1px solid $color;
		gap: 10px;
		height: 200px;
	}
	.form-car {
		background-color: $darker;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		border: 1px solid $color;
		gap: 10px;
		height: 200px;
	}

</style>
