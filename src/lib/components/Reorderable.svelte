<script lang="ts">
	export let list: Array<{ key: string; nome: string; quantidade: number; preco: number }> = [];
	export let update = (v: any) => {};

	let container: HTMLElement;
	let picked: any;
	let marker: HTMLElement;
	let target: any;
	let direction: number;

	function comparePosition(y: number, e: Element) {
		if (!e) return;
		if (e.classList.contains('locked')) return;
		const rect = e.getBoundingClientRect();
		if (y > rect.top && y < rect.bottom) {
			if (y < rect.top + rect.height * 0.5) {
				target = e;
				direction = -1;
			} else {
				target = e;
				direction = 1;
			}
		}
	}

	async function pickItem(e: any, touch = false) {
		e.dataTransfer.setData('text/plain', '');
		picked = e.target;

		marker.style.visibility = 'visible';
		comparePosition(e.clientY, picked);
		container.insertBefore(marker, direction > 0 ? picked.nextSibling : picked);
	}

	function moveItem(e: any, touch = false) {
		e.preventDefault();
		const y = touch && e.touches.length == 1 ? e.touches[0].clientY : e.clientY;
		const elements = container.querySelectorAll('.item');
		elements.forEach((element) => {
			comparePosition(y, element);
		});
		container.insertBefore(marker, direction > 0 ? target.nextSibling : target);
	}

	function dropItem() {
		if (picked && !picked.classList.contains('locked') && target) {
			reorderItems();
		}
		picked = null;
		target = null;
		direction = 0;
		marker.style.visibility = 'hidden';
	}

	function reorderItems() {
		if (!container || !picked) {
			return;
		}

		let picked_index = list.findIndex((e) => e.key === picked.id);
		let marker_index = list.findIndex((e) => e.key === target.id);

		if (picked_index === marker_index) {
			return;
		}
		if (direction !== 0 && picked_index - direction === marker_index) {
			return;
		}

		if (picked_index > marker_index && direction > 0) {
			marker_index += direction;
		}

		if (picked_index < marker_index && direction < 0) {
			marker_index += direction;
		}

		const picked_item = list.splice(picked_index, 1)[0];
		list.splice(marker_index, 0, picked_item);
		list = list;
		update(list);
	}

	function RemoveItem(i: number) {
		list.splice(i, 1);
		list = list;
		update(list);
	}

	function updateQuantity(i: number, value: string) {
		const numericValue = parseInt(value);
		list[i].quantidade = isNaN(numericValue) || numericValue === 0 ? '' : numericValue;
		update(list);
	}

	function updatePrice(i: number, price: string) {
		const numericValue = parseFloat(price.replace(/[^\d]/g, '')) / 100;
		list[i].preco = isNaN(numericValue) ? 0 : numericValue;
		update(list);
	}

	function currencyFormat(currency: number) {
		return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
			currency,
		);
	}
</script>

<div
	class="container component"
	on:dragover={moveItem}
	on:dragend={dropItem}
	on:touchmove={(e) => moveItem(e, true)}
	on:touchend={dropItem}
>
	<div class="list" bind:this={container}>
		<div bind:this={marker} class="marker" />

		{#each list as item, i}
			<div class="item" draggable={false} id={item.key} on:dragstart|self={pickItem} on:touchstart|self={(e) => pickItem(e, true)}>
				<div class="id">#{i + 1}</div>
				<div class="text" title="Edit">{item.nome}</div>
				<input type="number" name="quantity" id="quantity-{i}" min="0" value={item.quantidade === '' ? '' : item.quantidade} on:input={(e) => updateQuantity(i, e.target.value)}/>

				{#if item.quantidade !== 0}
					<input
						type="text"
						name="price"
						id="price-{i}"
						min="0"
						step="10"
						value={currencyFormat(item.preco)}
						on:input={(e) => updatePrice(i, e.target.value)}
					/>
				{/if}
				{#if item.quantidade === 0}
					<input type="text" name="price" id="price" min="0" step="10" disabled />
				{/if}
				<button on:click={() => RemoveItem(i)}>DEL</button>
			</div>
		{/each}
	</div>
</div>

<style lang="scss">
	@import 'src/lib/styles/mixins.scss';

	.container,
	.component {
		height: auto;
		padding: 0px;
		font-size: 100%;
	}

	.list {
		position: relative;
		padding: 2px;
	}

	.item {
		text-transform: uppercase;
		display: grid;
		grid-template-columns: max-content auto max-content max-content max-content;
		user-select: none;
		gap: 10px;
		padding: 0 10px;
		width: 100%;
		min-height: 32px;
		align-items: center;
		font-size: 14px;

		&:nth-child(even) {
			background: $lighter;
		}

		.id {
			border-right: 1px solid $bordercolor;
			padding-right: 10px;
		}

		input[type='text'] {
			@include form-input;
			height: 28px;
			width: 120px;
			text-align: center;
			border-radius: 5px;
		}

		input[type='number'] {
			@include form-input;
			height: 28px;
			width: 60px;
			text-align: center;
			border-radius: 5px;
		}

		button {
			@include button-base;
			border-radius: 5px;
			height: 30px;
			padding: 0;
			width: 60px;
			margin-top: 0;
		}
	}

	/* 	.item.locked {
		background: #60606010;
	} */

	.text {
		padding: 0px 4px;
		translate: 0px -1px;
	}

	.item:not(.locked):hover {
		background: var(--component-bg-hover);
	}

	.marker {
		left: 0px;
		right: 0px;
		position: absolute;
		height: 2px;
		translate: 0px -50%;
		background: cyan;
		visibility: hidden;
		z-index: 1;
	}
</style>
