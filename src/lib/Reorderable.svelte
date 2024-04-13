<script lang="ts">
	export let list: Array<any> = [];
	export let update = (v: any) => {};

	// reorderable
	let container: HTMLElement;
	let picked: any;
	let marker: HTMLElement;
	let target: any;
	let direction: number;

	function comparePosition(y: number, e: Element) {
		if (!e) return;
		if (e.classList.contains("locked")) return;
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
		// Required for some browsers to allow dragging
		e.dataTransfer.setData("text/plain", "");
		picked = e.target;

		marker.style.visibility = "visible";
		comparePosition(e.clientY, picked);
		container.insertBefore(marker, direction > 0 ? picked.nextSibling : picked);
	}

	function moveItem(e: any, touch = false) {
		e.preventDefault();
		const y = touch && e.touches.length == 1 ? e.touches[0].clientY : e.clientY;
		const elements = container.querySelectorAll(".item");
		elements.forEach((element) => {
			comparePosition(y, element);
		});
		container.insertBefore(marker, direction > 0 ? target.nextSibling : target);
	}

	function dropItem() {

		if (picked && !picked.classList.contains("locked") && target) {
			reorderItems();
		}
		picked = null;
		target = null;
		direction = 0;
		marker.style.visibility = "hidden";
	}

	// reorders item based on DOM ids
	function reorderItems() {
		if (!container || !picked) {
			return;
		}

		// const elements = Array.from(container.querySelectorAll('.item'))
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

</script>

<div class="container component" on:dragover={moveItem} on:dragend={dropItem} on:touchmove={(e) => moveItem(e, true)} on:touchend={dropItem}>
	<div class="list" bind:this={container}>
		<div bind:this={marker} class="marker" />

		{#each list as item,i}

				<div class="item" draggable={true}  id={item.key} on:dragstart|self={pickItem} on:touchstart|self={(e) => pickItem(e, true)}>

					<div class="text" title="Edit">{item}</div>
					<input type="number" name="quantity" id="quantity" placeholder="QTT">
					<input type="text" name="price" id="price" placeholder="Preço" value="">
					<button on:click={() => RemoveItem(i)}>DEL</button>

				</div>
		
		{/each}
	</div>
</div>

<style>
	div {
		box-sizing: border-box;
	}

	.container.component {
		padding: 0px;
		font-size: 100%;
	}

	.list {
		position: relative;
		padding: 2px;
	}

	input[type="checkbox"] {
		margin: 0px;
		padding: 0px;
		width: 16px;
		height: 16px;
		border: none;
	}


	input[type="text"] {
		margin: 0px;
		padding: 0px;
		width: 100%;
		height: 28px;
		border: none;
		text-align: center;
		border-radius: 5px;
	}
	input[type="number"] {
		margin: 0px;
		padding: 0px;
		width: 100%;
		height: 28px;
		border: none;
		text-align: center;
		border-radius: 5px;
	}

	.item {
		display: grid;
		grid-template-columns: auto 40px 90px auto;
		user-select: none;
		gap: 5px;
		width: 100%;
		min-height: 32px;
		border-radius: 2px;
		align-items: center;
		font-size: 90%;
	}

	.item.locked {
		background: #60606010;
	}

	[draggable="true"] {
		cursor: grab;
	}

	.item div {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
	}

	.center {
		justify-content: center;
	}

	.text {
		padding: 0px 4px;
		translate: 0px -1px;
	}

	.item:not(.locked):hover {
		background: var(--component-bg-hover);
	}

	.unfocus {
		opacity: 0.333333;
	}

	.handle {
		color: gray;
		opacity: 0.333;
	}

	.handle :global(svg) {
		width: 100%;
		height: 16px;
		translate: 2px 0px;
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
