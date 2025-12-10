// import React, { useState } from "react";
// import { UserPlus, Eye, EyeOff } from "lucide-react";
// import { registerApi } from "../../api/loginAPi/login";
// import { useNavigate } from "react-router-dom";
// import Input from "../../components/ui/Input";
// import Button from "../../components/ui/Button";
// import Select from "../../components/ui/Select";

// const userTypeOptions = [
//   { value: "MERCHANT", label: "Merchant" },
//   { value: "ADMIN", label: "Admin" },
//   { value: "USER", label: "User" },
// ];

// const SignUp = () => {
//   const [formData, setFormData] = useState({
//     username: "",
//     email: "",
//     phone: "",
//     password: "",
//     confirm_password: "",
//     userType: "", // Set a default
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSelectChange = (value: string) => {
//     setFormData((prev) => ({ ...prev, userType: value }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (formData.password !== formData.confirm_password) {
//       alert("Passwords do not match!");
//       return;
//     }
//     setLoading(true);
//     try {
//       const response = await registerApi(formData);
//       alert("Account created successfully!");
//       console.log("Response:", response.data);
//       setFormData({
//         username: "",
//         email: "",
//         phone: "",
//         password: "",
//         confirm_password: "",
//         userType: "MERCHANT",
//       });
//       navigate("/login");
//     } catch (error: any) {
//       console.error("Registration failed:", error);
//       alert(error.response?.data?.message || "Failed to create account.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-100">
//       <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
//         <h1 className="text-3xl font-bold text-center text-gray-900">
//           Create Account
//         </h1>

//         <form className="space-y-5" onSubmit={handleSubmit}>
//           <Input
//             label="Username"
//             type="text"
//             name="username"
//             value={formData.username}
//             onChange={handleChange}
//             placeholder="Enter your username"
//             required
//           />

//           <Input
//             label="Email address"
//             type="email"
//             name="email"
//             value={formData.email}
//             onChange={handleChange}
//             placeholder="user@email.com"
//             required
//           />

//           <Input
//             label="Phone number"
//             type="tel"
//             name="phone"
//             value={formData.phone}
//             onChange={handleChange}
//             placeholder="e.g., 98xxxxxxxx"
//             required
//           />

//           <Input
//             label="Password"
//             type={showPassword ? "text" : "password"}
//             name="password"
//             value={formData.password}
//             onChange={handleChange}
//             placeholder="Enter a password"
//             required
//             rightIcon={
//               <button
//                 type="button"
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="text-gray-500 hover:text-gray-700"
//               >
//                 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//               </button>
//             }
//           />

//           <Input
//             label="Confirm Password"
//             type={showConfirmPassword ? "text" : "password"}
//             name="confirm_password"
//             value={formData.confirm_password}
//             onChange={handleChange}
//             placeholder="Confirm your password"
//             required
//             rightIcon={
//               <button
//                 type="button"
//                 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                 className="text-gray-500 hover:text-gray-700"
//               >
//                 {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//               </button>
//             }
//           />

//           <Select
//             label="User Type"
//             value={formData.userType}
//             onChange={handleSelectChange}
//             options={userTypeOptions}
//           />

//           <Button
//             type="submit"
//             variant="primary"
//             className="w-full"
//             disabled={loading}
//             leftIcon={<UserPlus className="mr-2" size={20} />}
//           >
//             {loading ? "Creating Account..." : "Create Account"}
//           </Button>

//           <p className="text-center text-sm text-gray-500">
//             Already have an account?{" "}
//             <a
//               href="/login"
//               className="font-medium text-primary hover:underline"
//             >
//               Login
//             </a>
//           </p>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default SignUp;
