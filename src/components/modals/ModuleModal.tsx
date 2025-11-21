import React, { useContext, useEffect, useState } from "react";
import { icons, Plus } from "lucide-react";
import type { LucideProps } from "lucide-react";
import * as Icons from "lucide-react";
import {
  createSideBarApi,
  getSideBarApi,
  updateSideBarApi,
  type SideBarApi,
} from "../../api/sidebarApi/sideBarApi";
import { createNavUserRelation } from "../../api/navUserRelationApi/navUserRelationApi";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import Modal from "../ui/Modal";
import { NavItemsContext } from "../../context/navItemsContext";
import { toast } from "react-toastify";

interface ModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingModule: SideBarApi | null;
  isViewMode?: boolean;
}

interface ModuleFormData {
  label: string;
  url: string;
  order: number;
  icon: string;
}

export const ModuleModal: React.FC<ModuleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingModule,
  isViewMode = false,
}) => {
  const [search, setSearch] = useState("");
  const [showIconModal, setShowIconModal] = useState(false);
  const [navItem, setNavItem] = useState<SideBarApi[]>([]);
  const [formData, setFormData] = useState<ModuleFormData>({
    label: "",
    url: "",
    order: 1,
    icon: "",
  });
  const [selectedValue, setSelectedValue] = useState<string>("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { refreshNavItems } = useContext(NavItemsContext);
  // const { navItems } = useContext(NavItemsContext);

  const fetchNavItems = () => {
    // Use large page size for dropdowns
    getSideBarApi(moduleName).then((data: any) => {
      if (data.results) setNavItem(data.results);
      else setNavItem([]);
    });
  };

  useEffect(() => {
    fetchNavItems();
  }, []);

  useEffect(() => {
    if (editingModule) {
      setFormData({
        label: editingModule.label,
        url: editingModule.url,
        order: editingModule.order,
        icon: editingModule.icon,
      });
      setSelectedValue(String(editingModule.parent || "0"));
    } else {
      setFormData({ label: "", url: "", order: 1, icon: "" });
      setSelectedValue("0");
    }
  }, [editingModule, isOpen]);

  const selectOptions = [
    ...navItem.map((item) => ({ value: String(item.id), label: item.label })),
  ];

  const handleParentChange = (value: string) => {
    setSelectedValue(value);
  };

  const iconEntries = Object.entries(
    icons as Record<string, React.FC<LucideProps>>
  );
  const filteredIcons = iconEntries.filter(([name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenIconModal = () => {
    if (!isViewMode) setShowIconModal(true);
  };
  const handleCloseIconModal = () => setShowIconModal(false);

  const iconed = Icons as unknown as Record<
    string,
    React.ComponentType<{ size?: number; className?: string }>
  >;
  const SelectedIcon = formData.icon ? iconed[formData.icon] : null;

  const handleSelectIcon = (name: string) => {
    setFormData((prev) => ({ ...prev, icon: name }));
    setSearch(name);
    handleCloseIconModal();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "url") {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/^\/+/, "") }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;
    if (
      !formData.label.trim() ||
      !formData.url.trim() ||
      !formData.icon.trim()
    ) {
      toast.error("Please fill all required fields.");
      return;
    }
    setIsSubmitting(true);
    const dataToSend: SideBarApi = {
      ...formData,
      is_active: true,
      parent: Number(selectedValue) || undefined,
      module: moduleName,
    };

    try {
      if (editingModule) {
        await updateSideBarApi(editingModule.id!, dataToSend, moduleName);
        toast.success(`Module updated!`);
      } else {
        await createSideBarApi(dataToSend, moduleName);
        await createNavUserRelation({ label: formData.label });
        toast.success("Module created!");
      }
      refreshNavItems();
      fetchNavItems();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(
        `${error.response?.status || "Error"} - \n${
          error.response?.data || "Failed to save"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isViewMode
          ? "View Module"
          : editingModule
          ? "Edit Module"
          : "Create Module"
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          label="Label"
          type="text"
          name="label"
          value={formData.label}
          onChange={handleChange}
          placeholder="Enter label"
          required
          disabled={isViewMode}
        />
        <Input
          label="URL"
          type="text"
          name="url"
          value={formData.url}
          onChange={handleChange}
          placeholder="Enter URL"
          required
          disabled={isViewMode}
        />
        <Select
          label="Parent"
          value={selectedValue}
          onChange={handleParentChange}
          placeholder="Select Parent"
          options={selectOptions}
        />
        <Input
          label="Order"
          type="number"
          name="order"
          value={formData.order}
          onChange={handleChange}
          min={1}
          disabled={isViewMode}
        />
        <div className="mb-4">
          <label className="block mb-1.5 text-xs font-medium text-text-secondary">
            Icon
          </label>
          <div className="flex items-center gap-2">
            <Input
              label=""
              type="text"
              value={formData.icon}
              readOnly
              onClick={handleOpenIconModal}
              placeholder="Select icon"
              required
              disabled={isViewMode}
            />
            <button
              type="button"
              onClick={handleOpenIconModal}
              className={`text-primary transition ${
                isViewMode
                  ? "cursor-default opacity-50"
                  : "cursor-pointer hover:scale-110"
              }`}
              disabled={isViewMode}
            >
              {SelectedIcon ? <SelectedIcon size={28} /> : <Plus size={28} />}
            </button>
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </form>
      {showIconModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]"
          onClick={handleCloseIconModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-11/12 md:w-4/5 lg:w-9/12 max-h-[80vh] overflow-y-auto shadow-lg"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white">
                Choose Icon
              </h2>
              <button
                onClick={handleCloseIconModal}
                className="text-gray-600 dark:text-gray-300"
              >
                ✖
              </button>
            </div>
            <Input
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex flex-wrap gap-5 justify-center mt-5">
              {filteredIcons.map(([name, Icon]) => (
                <div
                  key={name}
                  className="flex flex-col items-center w-24 cursor-pointer hover:text-primary"
                  onClick={() => handleSelectIcon(name)}
                >
                  <Icon size={32} />
                  <span className="text-xs mt-2 truncate w-full text-center">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
