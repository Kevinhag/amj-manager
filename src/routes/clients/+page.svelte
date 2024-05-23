<script>
	import { onMount } from 'svelte';

	let clients = [];
	let selectedClient;
	let selectedClientData;

	$: selectedClientData = clients.find((client) => client.id == selectedClient);

	onMount(() => {
		fetch('http://localhost:3000/api/clients')
			.then((response) => response.json())
			.then((data) => {
				clients = data;
				console.log(data);
			});
	});

	let nome = '';
	let cpf = '';
	let endereco = '';
	let bairro = '';
	let cidade = '';
	let numero_casa = '';
	let complemento = '';
	let tel = '';
	let tel2 = '';

	function handleSubmit() {
		fetch('http://localhost:3000/api/data', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				nome,
				cpf,
				endereco,
				bairro,
				cidade,
				numero_casa,
				complemento,
				tel,
				tel2,
			}),
		})
			.then((response) => response.json())
			.then((data) => console.log(data))
			.catch((error) => console.error('Error:', error));
	}
</script>

<section>
	<div class="title">
		<div>
			<h2>Adicionar Cliente</h2>
		</div>
		<div>
			<h2>Lista de Clientes</h2>
		</div>
	</div>
	<div class="main">
		<form action="" class="client-add" on:submit|preventDefault={handleSubmit}>
			<div class="form-person">
				<label for="name">Nome</label>
				{#if selectedClientData != null}
					<input type="text" id="name" bind:value={selectedClientData.nome} />
				{:else}
					<input type="text" id="name" />
				{/if}
			</div>
			<!-- 			<div class="form-person">
				<label for="age">Age</label>
				<input type="number" id="age" bind:value={age} />
			</div> -->
			<div class="form-person">
				<label for="address">CPF</label>
				{#if selectedClientData != null}
					<input type="text" id="name" bind:value={selectedClientData.cpf} />
				{:else}
					<input type="text" id="name" />
				{/if}
			</div>
			<div class="form-person">
				<label for="address">Endereço</label>
				{#if selectedClientData != null}
					<input type="text" id="name" bind:value={selectedClientData.endereco} />
				{:else}
					<input type="text" id="name" />
				{/if}
			</div>
			<div class="form-person">
				<label for="address">Bairro</label>
				{#if selectedClientData != null}
					<input type="text" id="name" bind:value={selectedClientData.bairro} />
				{:else}
					<input type="text" id="name" />
				{/if}
			</div>
			<div class="form-person">
				<label for="address">Cidade</label>
				{#if selectedClientData != null}
					<input type="text" id="name" bind:value={selectedClientData.cidade} />
				{:else}
					<input type="text" id="name" />
				{/if}
			</div>
			<div class="form-person">
				<label for="address">Número</label>
				{#if selectedClientData != null}
					<input type="text" id="name" bind:value={selectedClientData.numero_casa} />
				{:else}
					<input type="text" id="name" />
				{/if}
			</div>
			<div class="form-person">
				<label for="address">Complemento</label>
				{#if selectedClientData != null}
					<input type="text" id="name" bind:value={selectedClientData.complemento} />
				{:else}
					<input type="text" id="name" />
				{/if}
			</div>
			<div class="form-person">
				<label for="address">Telefone</label>
				{#if selectedClientData != null}
					<input type="text" id="name" bind:value={selectedClientData.tel} />
				{:else}
					<input type="text" id="name" />
				{/if}
			</div>
			<div class="form-person">
				<label for="address">Telefone 2</label>
				{#if selectedClientData != null}
					<input
						type="text"
						id="name"
						pattern="^(\+\d{(1, 2)}\s?)?(\(\d{(1, 4)}\)\s?)?(\d{(1, 2)}-?)?(\d{(8,
						9)})$"
						bind:value={selectedClientData.tel2}
					/>
				{:else}
					<input type="text" id="name" />
				{/if}
			</div>
			<div>
				<button type="submit">Adicionar Usuário</button>
				{#if selectedClientData != null}
					<button on:click={() => (selectedClientData = null)}>Novo Cliente</button>
				{:else}
					<button disabled>Novo Cliente</button>
				{/if}
			</div>

		</form>

		<div class="client-list">
			<select name="clients" id="clients" size="5" bind:value={selectedClient}>
				{#if clients.length === 0}
					<p>Nenhum item encontrado</p>
				{:else}
					{#each clients as client (client.id)}
						<option value={client.id}>{client.nome} - {client.cpf}</option>
					{/each}
				{/if}
			</select>
		</div>
	</div>
</section>

<style lang="scss">
	section {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		justify-content: center;
		align-items: center;

		.title {
			display: grid;
			grid-template-columns: 1fr 1fr;
			width: 100%;
			height: 80px;
			gap: 20px;
			> * {
				display: flex;
				justify-content: center;
				align-items: center;
				height: 100%;
				width: 100%;
				padding: 10px;
			}
		}

		.main {
			display: grid;
			grid-template-columns: 1fr 1fr;
			justify-content: space-evenly;
			gap: 20px;
			align-items: end;
			width: 100%;
			height: 100%;
			> * {
				width: 100%;
				height: 100%;
			}

			.client-list {
				display: flex;
				flex-direction: column;
				justify-content: center;
				height: 100%;
				border: 1px solid #cccccc33;
				border-radius: $radius;
				select {
					height: 100%;
					font: 700 14px 'Roboto Mono', Arial, sans-serif;
				}
				#clients {
					width: 100%;
					height: 100%;
				}
			}
			.client-add {
				display: flex;
				justify-content: center;
				align-items: center;
				background-color: #44444433;
				flex-wrap: wrap;
				width: 100%;
				height: 100%;
				gap: 10px;
				padding: 20px;
				border: 1px solid #cccccc33;
				border-radius: 10px;

				.form-person {
					width: 40%;
					display: flex;
					flex-direction: column;
					gap: 5px;
					label {
						color: $maintextcolor;
					}
					input {
						font: 700 14px 'Roboto Mono', Arial, sans-serif;
						padding: 5px;
						border-radius: 5px;
						border: 1px solid #cccccc33;
					}
				}
				#name {
						width: 100%;
					}
			}
		}
	}
</style>
