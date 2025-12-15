import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import * as Icons from "lucide-react";
import {
  createSideBarApi,
  updateSideBarApi,
  getSideBarApi,
  type SideBarApi,
} from "../../api/sidebarApi/sideBarApi";
import { createNavUserRelation } from "../../api/navUserRelationApi/navUserRelationApi";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Select from "../ui/Select";
import Modal from "../ui/Modal";
import type { LucideProps } from "lucide-react";

interface ModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  editingModule: SideBarApi | null;
  isViewMode?: boolean;
}

interface Option {
  label: string;
  value: string;
}

export const ModuleModal: React.FC<ModuleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleName,
  editingModule,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState({
    label: "",
    url: "",
    icon: "HelpCircle",
    parent: "",
    order: "",
    is_active: true,
  });

  const [parentOptions, setParentOptions] = useState<Option[]>([]);
  const [allModules, setAllModules] = useState<SideBarApi[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIconModal, setShowIconModal] = useState(false);
  const [search, setSearch] = useState("");

  const iconEntries = Object.entries(
    Icons as unknown as Record<string, React.FC<LucideProps>>
  ).filter(
    ([key]) => key !== "icons" && typeof (Icons as any)[key] !== "function"
  );

  const filteredIcons = iconEntries.filter(([name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setShowIconModal(false);
      setSearch("");
      getSideBarApi(moduleName, 1, 1000).then((res: any) => {
        let list: SideBarApi[] = [];
        if (res && res.results) list = res.results;
        else if (Array.isArray(res)) list = res;

        setAllModules(list);

        setParentOptions(
          list.map((m) => ({ label: m.label, value: String(m.id) }))
        );
      });
    }
  }, [isOpen, moduleName]);

  useEffect(() => {
    if (isOpen && editingModule) {
      setFormData({
        label: editingModule.label,
        url: editingModule.url,
        icon: editingModule.icon || "HelpCircle",
        parent: editingModule.parent ? String(editingModule.parent) : "",
        order:
          editingModule.order !== undefined && editingModule.order !== null
            ? String(editingModule.order)
            : "",
        is_active: editingModule.is_active ?? true,
      });
    } else if (isOpen) {
      setFormData({
        label: "",
        url: "",
        icon: "HelpCircle",
        parent: "",
        order: "",
        is_active: true,
      });
    }
  }, [isOpen, editingModule]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    if (name === "parent") {
      let newUrl = formData.url;

      if (formData.url) {
        // 1. Extract "Leaf" slug (e.g., "settings/test" -> "test")
        const parts = formData.url.split("/").filter((p) => p !== "");
        const leafSlug =
          parts.length > 0 ? parts[parts.length - 1] : formData.url;

        if (value) {
          // 2. Parent Selected: Prepend Parent URL
          const parentMod = allModules.find((m) => String(m.id) === value);
          if (parentMod) {
            // Clean parent url (remove any stray slashes)
            const parentPath = parentMod.url.replace(/^\/+|\/+$/g, "");
            // Combine: parent/child (No leading slash per your request)
            newUrl = `${parentPath}/${leafSlug}`;
          }
        } else {
          // 3. Parent Deselected: Just the leaf slug (No leading slash)
          newUrl = leafSlug;
        }
      }

      setFormData((prev) => ({
        ...prev,
        parent: value,
        url: newUrl, // Auto-updated URL
        order: "", // Reset order to null (empty string)
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleOpenIconModal = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isViewMode) setShowIconModal(true);
  };

  const handleCloseIconModal = () => setShowIconModal(false);

  const handleSelectIcon = (name: string) => {
    setFormData((prev) => ({ ...prev, icon: name }));
    setSearch("");
    setShowIconModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.label || !formData.url) {
      toast.error("Label and URL are required.");
      return;
    }

    setIsSubmitting(true);

    const finalOrder = formData.order === "" ? null : Number(formData.order);

    const payload: any = {
      label: formData.label,
      url: formData.url,
      icon: formData.icon,
      order: finalOrder,
      is_active: formData.is_active,
      parent: formData.parent ? Number(formData.parent) : null,
      module: moduleName,
    };

    try {
      if (editingModule) {
        await updateSideBarApi(editingModule.id!, payload, moduleName);
        toast.success("Module updated successfully!");
      } else {
        await createSideBarApi(payload, moduleName);
        await createNavUserRelation({ label: formData.label });
        toast.success("Module created successfully!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to save module.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const SelectedIcon = (Icons as any)[formData.icon] || Icons.HelpCircle;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          isViewMode
            ? "View Module"
            : editingModule
            ? "Edit Module"
            : "Add Module"
        }
        className="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Label"
            name="label"
            value={formData.label}
            onChange={handleChange}
            placeholder="Dashboard"
            required
            disabled={isViewMode}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Parent Module"
              value={formData.parent}
              onChange={(v) => handleSelect("parent", v)}
              options={parentOptions}
              placeholder="None"
              disabled={isViewMode}
              clearable={true}
            />

            <Input
              label="Order"
              type="number"
              name="order"
              value={String(formData.order)}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder="Auto (Last)"
            />
          </div>

          <Input
            label="URL Path"
            name="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="dashboard"
            required
            disabled={isViewMode}
          />

          <div className="flex flex-col">
            <label className="mb-1.5 text-xs font-medium text-text-secondary dark:text-gray-300">
              Icon
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenIconModal}
                className={`w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg text-primary border border-gray-200 dark:border-gray-600 transition ${
                  isViewMode
                    ? "cursor-default opacity-50"
                    : "cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                disabled={isViewMode}
              >
                <SelectedIcon size={20} />
              </button>
              <div className="flex-1">
                <input
                  type="text"
                  value={formData.icon}
                  readOnly
                  onClick={handleOpenIconModal}
                  className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-input transition duration-150 ease-in-out focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary 
                  dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
                  ${
                    isViewMode ? "cursor-default opacity-50" : "cursor-pointer"
                  }`}
                  placeholder="Select Icon"
                  disabled={isViewMode}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              {isViewMode ? "Close" : "Cancel"}
            </Button>
            {!isViewMode && (
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving"
                  : editingModule
                  ? "Save Changes"
                  : "Add Module"}
              </Button>
            )}
          </div>
        </form>
      </Modal>

      {/* Icon Picker Modal */}
      <Modal
        isOpen={showIconModal}
        onClose={handleCloseIconModal}
        title="Choose Icon"
        className="max-w-4xl"
      >
        <div className="space-y-4">
          <Input
            label="Search Icons"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type to filter"
            autoFocus
          />

          <div className="flex flex-wrap gap-4 justify-center mt-4 max-h-[60vh] overflow-y-auto p-2">
            {filteredIcons.slice(0, 100).map(([name, IconComponent]) => (
              <div
                key={name}
                className="flex flex-col items-center w-24 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary transition-colors group"
                onClick={() => handleSelectIcon(name)}
              >
                <IconComponent
                  size={32}
                  className="text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors"
                />
                <span className="text-[10px] mt-2 truncate w-full text-center text-gray-500 dark:text-gray-400 group-hover:text-primary">
                  {name}
                </span>
              </div>
            ))}
            {filteredIcons.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 py-10">
                No icons found matching "{search}"
              </p>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
