"use strict";
//Tạo một bản đồ ngẫu nhiên
const generateBoard = () => {
    let board = []; //tạo bảng
    let k = 0; //cho chỉ mục khóa
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
            });
            k++;
        }
    }
    // Thuật toán Binary Tree - một trong những thuật toán tạo mê cung đơn giản nhất
    // Mỗi ô chỉ phá một trong hai tường: hoặc tường phía trên, hoặc tường phía trái
    // Reset toàn bộ bản đồ
    for (let i = 0; i < board.length; i++) {
        // Đặt tường ở tất cả các cạnh
        board[i].top = true;
        board[i].right = true;
        board[i].bottom = true;
        board[i].left = true;
        board[i].ableToConnect = true;
    }
    // Duyệt qua tất cả các ô (trừ cạnh trên cùng và trái cùng)
    for (let i = 0; i < board.length; i++) {
        // Bỏ qua các ô ở cạnh trên cùng và trái cùng (row = 1 hoặc col = 1)
        if (board[i].row === 1 && board[i].col === 1) {
            continue; // Bỏ qua ô góc trên bên trái
        }
        let possibilities = [];
        // Nếu không phải ô ở hàng đầu tiên, có thể phá tường phía trên
        if (board[i].row > 1) {
            possibilities.push("top");
        }
        // Nếu không phải ô ở cột đầu tiên, có thể phá tường bên trái
        if (board[i].col > 1) {
            possibilities.push("left");
        }
        // Nếu có thể phá tường
        if (possibilities.length > 0) {
            // Chọn ngẫu nhiên một tường để phá
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
    printBoard(board); //in bảng sau khi mọi thứ hoàn thành
    return board;
};
// ---------------------------------------------------------------------------------------------------------------
const printBoard = (board) => {
    for (let i of board) { //đối với mỗi ô của bảng
        let string = ''; //tạo một chuỗi trống
        i.left ? string += '[' : string += ' '; //nếu tường bên trái của ô là true, thêm [ vào chuỗi
        i.top ? string += '^' : string += ' '; //nếu tường phía trên của ô là true, thêm ^ vào chuỗi
        i.bottom ? string += '_' : string += ' '; //if the tile's bottom wall is true, add _ to the string
        i.right ? string += ']' : string += ' '; //if the tile's right wall is true, add ] to the string
        process.stdout.write(string); //write out the string to the console (using process.stdout.write to make sure there is no line return)
        if (i.col === 10) { //after there is 10 columns, create a line return
            console.log(); //line return
        }
    }
};
// const printItem = i => {
//     let string = '' //creates an empty string
//     i.left ? string += '[' : string += ' ' //if the tile's left wall is true, add [ to the string
//     i.top ? string += '^' : string += ' ' //if the tile's top wall is true, add ^ to the string
//     i.bottom ? string += '_' : string += ' ' //if the tile's bottom wall is true, add _ to the string
//     i.right ? string += ']' : string += ' '  //if the tile's right wall is true, add ] to the string
//     process.stdout.write(string) //write out the string to the console (using process.stdout.write to make sure there is no line return) 
//     if (i.col === 10) { //after there is 10 columns, create a line return 
//         console.log() //line return
//     }    
// }
const tokens = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
const generateId = (ids) => {
    let id = "";
    for (let i = 0; i < 5; i++) {
        id += tokens[Math.floor(Math.random() * tokens.length)];
    }
    console.log("DKSLFJSDKLFJDSKLFJDSKLF", ids);
    if (!(id in ids)) {
        return id;
    }
    return generateId(ids);
};
module.exports = {
    generateBoard,
    generateId
};
generateBoard();
console.log(generateId([]));
//# sourceMappingURL=map.js.map