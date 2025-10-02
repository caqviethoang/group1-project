// Mảng tạm users (thay thế bằng database sau này)
let users = [
  { id: 1, name: 'Nguyễn Văn A', email: 'a@example.com', age: 25 },
  { id: 2, name: 'Trần Thị B', email: 'b@example.com', age: 30 },
  { id: 3, name: 'Lê Văn C', email: 'c@example.com', age: 22 }
];

let nextId = 4; // ID tiếp theo cho user mới

const userController = {
  // GET /users - Lấy danh sách tất cả users
  getAllUsers: (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Lấy danh sách users thành công',
        data: users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi server',
        error: error.message
      });
    }
  },

  // POST /users - Tạo user mới
  createUser: (req, res) => {
    try {
      const { name, email, age } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!name || !email || !age) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ thông tin: name, email, age'
        });
      }

      // Kiểm tra email đã tồn tại chưa
      const existingUser = users.find(user => user.email === email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email đã tồn tại trong hệ thống'
        });
      }

      // Tạo user mới
      const newUser = {
        id: nextId++,
        name,
        email,
        age: parseInt(age)
      };

      users.push(newUser);

      res.status(201).json({
        success: true,
        message: 'Tạo user thành công',
        data: newUser
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi server',
        error: error.message
      });
    }
  }
};

module.exports = userController;