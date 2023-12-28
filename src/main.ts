const containerElement = document.getElementById('container')

if (!containerElement) {
    throw new Error('No container element')
}

/**
 * Vars
 */
const columnsCount = 45
const rowsCount = 30
const cellSize = 30
const borderWidth = 1

const canvasWidth = columnsCount * cellSize + (columnsCount + 1) * borderWidth
const canvasHeight = rowsCount * cellSize + (rowsCount + 1) * borderWidth

let emojiAlive = '😼'
let emojiDead = '🙀'

let isDeadVisible = true
let isPaused = false

/**
 * Init canvas and grid abstraction
 */
const canvas = document.createElement('canvas')
containerElement.appendChild(canvas)

canvas.id = 'canvas'
canvas.width = canvasWidth
canvas.height = canvasHeight

const ctx = canvas.getContext('2d')

if (!ctx) {
    throw new Error('No canvas context')
}

const dpr = window.devicePixelRatio
const canvasBoundingClientRect = canvas.getBoundingClientRect()

canvas.width = canvasBoundingClientRect.width * dpr
canvas.height = canvasBoundingClientRect.height * dpr
canvas.style.width = `${canvasBoundingClientRect.width}px`
canvas.style.height = `${canvasBoundingClientRect.height}px`

ctx.scale(dpr, dpr)

const metrics = ctx.measureText(emojiAlive)
const textVerticalOffset = metrics.fontBoundingBoxDescent + cellSize + borderWidth

function drawGrid(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.lineWidth = 1
    ctx.strokeStyle = 'darkgrey'

    ctx.save()

    ctx.translate(0.5, 0.5)

    // Vertical lines
    for (let x = 0; x <= canvasWidth; x += cellSize + borderWidth) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvasHeight)
        ctx.stroke()
    }

    // Horizontal lines
    for (let y = 0; y <= canvasHeight; y += cellSize + borderWidth) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvasWidth, y)
        ctx.stroke()
    }

    ctx.restore()
}

function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, emoji: string) {
    ctx.font = '30px Verdana'
    ctx.fillStyle = 'black'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillText(emoji, ...gridPointToCanvasCoordinates(x, y))
}

function gridPointToCanvasCoordinates(x: number, y: number): [number, number] {
    return [x * (cellSize + borderWidth) + 1, y * (cellSize + borderWidth) + textVerticalOffset]
}

function drawCells(ctx: CanvasRenderingContext2D) {
    for (let x = 0; x < columnsCount; x++) {
        for (let y = 0; y < rowsCount; y++) {
            if (isDeadVisible) {
                if (state[x][y] !== null) {
                    drawCell(ctx, x, y, state[x][y] ? emojiAlive : emojiDead)
                }
            } else if (state[x][y]) {
                drawCell(ctx, x, y, emojiAlive)
            }
        }
    }
}

function drawFrame(ctx: CanvasRenderingContext2D) {
    drawGrid(ctx)
    drawCells(ctx)
}

function handleCanvasClick(this: HTMLCanvasElement, event: MouseEvent) {
    const canvasBoundingClientRect = this.getBoundingClientRect()
    const canvasX = event.clientX - canvasBoundingClientRect.left
    const canvasY = event.clientY - canvasBoundingClientRect.top

    const x = Math.ceil(canvasX / (cellSize + borderWidth)) - 1
    const y = Math.ceil(canvasY / (cellSize + borderWidth)) - 1

    state[x][y] = true
}

/**
 * Game rules
 */
function getInitialState(): Array<Array<null | boolean>> {
    return Array.from({ length: columnsCount }, () => Array(rowsCount).fill(null))
}

let state = getInitialState()

/**
 * Glider gun
 */
state[1][5] = true
state[1][6] = true
state[2][5] = true
state[2][6] = true

state[11][5] = true
state[11][6] = true
state[11][7] = true
state[12][4] = true
state[12][8] = true
state[13][3] = true
state[13][9] = true
state[14][3] = true
state[14][9] = true
state[15][6] = true
state[16][4] = true
state[16][8] = true
state[17][5] = true
state[17][6] = true
state[17][7] = true
state[18][6] = true

state[21][3] = true
state[21][4] = true
state[21][5] = true
state[22][3] = true
state[22][4] = true
state[22][5] = true
state[23][2] = true
state[23][6] = true

state[25][1] = true
state[25][2] = true
state[25][6] = true
state[25][7] = true

state[35][3] = true
state[35][4] = true
state[36][3] = true
state[36][4] = true

function getNextState() {
    const nextState = getInitialState()

    for (let x = 0; x < columnsCount; x++) {
        for (let y = 0; y < rowsCount; y++) {
            const current = state[x][y]

            const alive = [
                state[x - 1]?.[y - 1],
                state[x - 1]?.[y],
                state[x - 1]?.[y + 1],

                state[x]?.[y - 1],
                state[x]?.[y + 1],

                state[x + 1]?.[y - 1],
                state[x + 1]?.[y],
                state[x + 1]?.[y + 1],
            ].filter(Boolean).length

            if (current) {
                if (alive < 2) {
                    nextState[x][y] = false
                } else if (alive === 2 || alive === 3) {
                    nextState[x][y] = true
                } else if (alive > 3) {
                    nextState[x][y] = false
                }
            } else if (alive === 3) {
                nextState[x][y] = true
            }
        }
    }

    return nextState
}

/**
 * Animation loop
 */
let last = window.performance.now()

function frame(now: number) {
    if (!ctx) {
        throw new Error('No canvas context')
    }

    if (now - last >= 80) {
        last = now

        if (!isPaused) {
            state = getNextState()
        }
    }

    drawFrame(ctx)

    window.requestAnimationFrame(frame)
}

/**
 * Event handlers
 */
canvas.addEventListener('click', handleCanvasClick)

document.getElementById('pause-btn')?.addEventListener('click', function (this: HTMLButtonElement) {
    isPaused = !isPaused
    this.innerText = isPaused ? 'Continue' : 'Pause'
})

document
    .getElementById('hide-dead-checkbox')
    ?.addEventListener('change', function (this: HTMLInputElement) {
        isDeadVisible = !this.checked
        this.innerText = this.checked ? 'Hide dead' : 'Show dead'
    })

/**
 * Run game
 */
frame(0)
