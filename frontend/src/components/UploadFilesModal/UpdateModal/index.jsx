import React, { useEffect } from "react";
import { Modal, Button, Form, Input, Select, Tag, Collapse } from "antd";
import {
  metaDataCategory,
  metaDataSubCategory,
  metaDataTags,
} from "../../../constants/index.js";
import { initialState } from "../../../reducer/modalReducer.js";

const { Option } = Select;
const { Panel } = Collapse;

const UpdateModal = ({ isVisible, onOk, onCancel, state, dispatch }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (state === initialState) {
      form.resetFields();
    } else {
      form.setFieldsValue({
        name: state.baseName || "",
        category: state.category || null,
        subCategory: state.subCategory || null,
        description: state.description || "",
        tags: state.tags || [],
      });
    }
  }, [state, form]);

  return (
    <Modal
      title={
        <div className="text-white text-base font-bold">Upload File(s)</div>
      }
      open={isVisible}
      onOk={onOk}
      centered
      onCancel={onCancel}
      width={800}
      styles={{
        content: {
          background: "#1F1E23",
          color: "#FFFFFF",
          boxShadow: "0px 2px 10px 0px #000000CC",
        },
        header: { background: "#1F1E23", color: "#FFFFFF" },
      }}
      footer={[
        <Button
          key="cancel"
          onClick={onCancel}
          className="bg-[#303038] text-[#DCDCDC] border-none"
        >
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={onOk}
          className="!bg-[#303038] text-[#DCDCDC] disabled:text-[#46464F] border-none "
          loading={state.loading}
        >
          Save
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="horizontal"
        className="!bg-[#24242A] p-3 rounded"
      >
        {/* File Name */}
        <Form.Item
          label={<div className="text-[#C8C8C8] text-sm">Name</div>}
          name="name"
          className="w-[50%]"
          rules={[{ required: true, message: "File name is required" }]}
        >
          <Input
            onChange={(e) =>
              dispatch({ type: "SET_FILE_NAME", payload: e.target.value })
            }
            classNames={{
              input:
                "text-[#F6F6F6] bg-[#212126] border-2 border-[#46464F] hover:bg-[#212126] focus:bg-[#212126] focus:border-[#46464F] hover:border-[#46464F]",
            }}
            addonAfter={state.extension}
          />
        </Form.Item>

        <hr className="w-full h-[1px] bg-[#303038] border-none mt-4" />

        <Collapse
          accordion
          ghost
          onChange={() => dispatch({ type: "TOGGLE_DOCUMENT_INFO" })}
          expandIconPosition="start"
          style={{
            backgroundColor: "transparent",
            border: "none",
            width: "100%",
          }}
        >
          <Panel
            header="Document Information"
            key="1"
            style={{
              fontSize: "14px",
              color: "#EAEAEA",
            }}
          >
            <div className="flex gap-4">
              <div className="flex-1">
                {/* Category */}
                <Form.Item name="category">
                  <Select
                    placeholder="Category"
                    onChange={(value) =>
                      dispatch({ type: "SET_CATEGORY", payload: value })
                    }
                  >
                    {metaDataCategory.map((category, idx) => (
                      <Option value={category} key={idx}>
                        {category}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* Sub-category */}
                <Form.Item name="subCategory">
                  <Select
                    placeholder="Sub-category"
                    onChange={(value) =>
                      dispatch({ type: "SET_SUBCATEGORY", payload: value })
                    }
                  >
                    {metaDataSubCategory.map((subcategory, idx) => (
                      <Option value={subcategory} key={idx}>
                        {subcategory}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* Tags */}
                <Form.Item name="tags">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Select
                      placeholder="Tags"
                      onChange={(value) =>
                        dispatch({ type: "ADD_TAG", payload: value })
                      }
                    >
                      {metaDataTags.map((tag, idx) => (
                        <Option value={tag} key={idx}>
                          {tag}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    {state.tags &&
                      state.tags.map((tag) => (
                        <Tag
                          closable
                          key={tag}
                          onClose={() =>
                            dispatch({ type: "REMOVE_TAG", payload: tag })
                          }
                          style={{ marginBottom: "5px" }}
                        >
                          {tag}
                        </Tag>
                      ))}
                  </div>
                </Form.Item>
              </div>
              <div className="flex-1">
                {/* Description */}
                <Form.Item
                  layout="vertical"
                  label={
                    <div className="text-[#C8C8C8] text-sm">Description:</div>
                  }
                  name="description"
                >
                  <Input.TextArea
                    rows={7}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_DESCRIPTION",
                        payload: e.target.value,
                      })
                    }
                    classNames={{
                      textarea:
                        "text-[#F6F6F6] bg-[#212126] border-2 border-[#46464F] hover:bg-[#212126] focus:bg-[#212126] focus:border-[#46464F] hover:border-[#46464F]",
                    }}
                    style={{
                      resize: "none",
                    }}
                  />
                </Form.Item>
              </div>
            </div>
          </Panel>
        </Collapse>
      </Form>
    </Modal>
  );
};

export default UpdateModal;
