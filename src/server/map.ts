//Tạo một bản đồ ngẫu nhiên

// Game được làm bằng Framework "Phaser game"

/**
 * [BOARD]: Là 1 khái niệm về 1 ô map trong game, 100 ô ghép lại tạo thành 1 map
 * - Thuật toán sử dụng việc tạo ra 1 bản đồ ngẫu nhiên
 * - Bản đồ sẽ được tạo ra từ 100 ô (10x10) theo mảng
 * - Mỗi ô sẽ có 4 hướng (top, bottom, left, right), mỗi ô tạo thành 1 hình vuông để ghép map
 * - Chúng ta sẽ thực hiện 1 thuật toán chọn ngẫu nhiên các hướng để tạo ra tường cho các ô map ngẫu nhiên
 */

const generateBoard = (type: string) => {
    let board = [] //tạo bảng
    let k = 0 //cho chỉ mục khóa
    // Toán lồng bảng tạo số:
    // - Gồm 10 row
    // - Row = 1 thì Col = 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    // - Row = 2 thì Col = 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    // - Row = n số thì Col = 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    // Bảng index 10x10 = 100 mảng
    // Index = 99 và 0 (bao gồm 0)

    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) { //thêm 100 ô vào bảng với thông tin
            board.push({
                row: i + 1,
                col: j + 1,
                top: false,
                bottom: false,
                left: false,
                right: false,
                ableToConnect: false,
                index: k
            })
            k++
        }
    }

    type = "ok"
    if (type !== "null") {
        // Reset toàn bộ bản đồ
        for (let i = 0; i < board.length; i++) {
            board[i].top = true;
            board[i].right = true;
            board[i].bottom = true;
            board[i].left = true;
            board[i].ableToConnect = true;
        }
        for (let i = 0; i < board.length; i++) {
            if (board[i].row === 1 && board[i].col === 1) {
                continue;
            }
            let possibilities = [];
            if (board[i].row > 1) {
                possibilities.push("top");
            }
            if (board[i].col > 1) {
                possibilities.push("left");
            }
            if (possibilities.length > 0) {
                let randomWall = possibilities[Math.floor(Math.random() * possibilities.length)];
                switch (randomWall) {
                    case "top":
                        board[i].top = false;
                        board[i - 10].bottom = false;
                        break;
                    case "left":
                        board[i].left = false;
                        board[i - 1].right = false;
                        break;
                }
            }
        }
        // printBoard(board)
    } else {
        for (let i of board) {
            if (i.row === 1) i.top = true
            if (i.row === 10) i.bottom = true
            if (i.col === 1) i.left = true
            if (i.col === 10) i.right = true
        }
    }

    return board
}

let tokens = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("")
const generateId = (ids: string[]): string => {
    let id = ""
    for (let i = 0; i < 5; i++) {
        id += tokens[Math.floor(Math.random() * tokens.length)]
    }

    if (!ids.includes(id)) {
        return id
    }
    return generateId(ids)
}

export {
    generateBoard,
    generateId
}
// ---------------------------------------------------------------------------------------------------------------

const printBoard = (board: Array<{ left: boolean; top: boolean; bottom: boolean; right: boolean; col: number; }>) => { //in toàn bộ bảng
    for (let i of board) { //đối với mỗi ô của bảng
        let string = '' //tạo một chuỗi trống
        i.left ? string += '[' : string += ' ' //nếu tường bên trái của ô là true, thêm [ vào chuỗi
        i.top ? string += '^' : string += ' ' //nếu tường phía trên của ô là true, thêm ^ vào chuỗi
        i.bottom ? string += '_' : string += ' ' //if the tile's bottom wall is true, add _ to the string
        i.right ? string += ']' : string += ' ' //if the tile's right wall is true, add ] to the string
        process.stdout.write(string) //write out the string to the console (using process.stdout.write to make sure there is no line return)
        if (i.col === 10) { //after there is 10 columns, create a line return
            console.log() //line return
        }
    }
}
