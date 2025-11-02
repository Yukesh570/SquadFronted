import { icons, Plus, HelpCircle } from "lucide-react";
import type { LucideProps } from "lucide-react";
import React, { useState } from "react";
import { createSideBarApi } from "../../api/sidebarApi/sideBarApi";
import { useSidebarContext } from "../../context/sideBarContext";
import * as Icons from "lucide-react";
import { createNavUserRelation } from "../../api/navUserRelationApi/navUserRelationApi";

const CreateSidebar = () => {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    label: "",
    url: "",
    order: 1,
    is_active: true,
    icon: "",
  });

  const iconEntries = Object.entries(
    icons as Record<string, React.FC<LucideProps>>
  );

  const filteredIcons = iconEntries.filter(([name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  const { triggerRefresh } = useSidebarContext();
  const iconed = Icons as unknown as Record<
    string,
    React.ComponentType<{ size?: number; className?: string }>
  >;
  const SelectedIcon = formData.icon ? iconed[formData.icon] : null;

  const handleSelectIcon = (name: string) => {
    setFormData((prev) => ({ ...prev, icon: name }));
    setSearch(name);
    handleCloseModal();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const { name } = target;
    const value =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const response = await createSideBarApi(formData);
      const secondResponse=await createNavUserRelation({ label: formData.label })
      // alert("Sidebar created successfully!");
      triggerRefresh();
      setFormData({
        
        label: "",
        url: "",
        order: 1,
        is_active: true,
        icon: "",
      })
      
      console.log("Response:", response);
    } catch (error: any) {
      console.error("Error creating sidebar:", error);
      alert(`${error.response.status} Error \n${error.response.data}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
        Create Sidebar Item
      </h2>

      {/* Label */}
      <div className="mb-4">
        <label className="block mb-1 font-medium text-gray-800 dark:text-white">
          Label
        </label>
        <input
          type="text"
          name="label"
          value={formData.label}
          onChange={handleChange}
          placeholder="Enter label"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
             focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* URL */}
      <div className="mb-4">
        <label className="block mb-1 font-medium text-gray-800 dark:text-white">
          URL
        </label>
        <input
          type="text"
          name="url"
          value={formData.url}
          onChange={handleChange}
          placeholder="Enter URL"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
             focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Order */}
      <div className="mb-4">
        <label className="block mb-1 font-medium text-gray-800 dark:text-white">
          Order
        </label>
        <input
          type="number"
          name="order"
          value={formData.order}
          onChange={handleChange}
          min={1}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
             focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Active Toggle */}
      <div className="mb-4 flex items-center space-x-2 ">
        <input
          type="checkbox"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          id="is_active"
          className=" border-gray-300 dark:border-gray-600 rounded-lg 
             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
             focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <label htmlFor="is_active" className="text-gray-800 dark:text-white">
          Active
        </label>
      </div>

      {/* Icon Picker */}
      <div className="mb-4">
        <label className="block mb-1 font-medium text-gray-800 dark:text-white">
          Icon
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={formData.icon}
            readOnly
            onClick={handleOpenModal}
            placeholder="Select icon"
            className=" p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
             focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {SelectedIcon ? (
            <SelectedIcon
              size={28}
              className="text-indigo-600 cursor-pointer hover:scale-110 transition"
            />
          ) : (
            <Plus
              size={28}
              className="text-indigo-600 cursor-pointer hover:scale-110 transition"
              onClick={handleOpenModal}
            />
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition"
      >
        Create Sidebar
      </button>

      {/* Icon Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          onClick={handleCloseModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl p-6 w-11/12 md:w-3/4 lg:w-1/2 max-h-[80vh] overflow-y-auto shadow-lg"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Choose an Icon</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-600 text-xl hover:text-gray-900"
              >
                ✖
              </button>
            </div>

            <input
              type="text"
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex flex-wrap gap-5 text-indigo-600 justify-center">
              {filteredIcons.length > 0 ? (
                filteredIcons.map(([name, IconComponent]) => (
                  <div
                    key={name}
                    className="flex flex-col items-center w-24 cursor-pointer hover:text-indigo-800 transition"
                    onClick={() => handleSelectIcon(name)}
                  >
                    <IconComponent size={32} />
                    <span className="text-xs text-center mt-2 truncate w-full overflow-hidden text-ellipsis">
                      {name}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <HelpCircle size={32} />
                  <span className="text-xs mt-2">No icons found</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateSidebar;
