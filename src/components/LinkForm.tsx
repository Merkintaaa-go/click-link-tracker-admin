
import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Result } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { createLink } from '../api';

const { Title } = Typography;

const LinkForm: React.FC = () => {
  const [form] = Form.useForm();
  const [createdLink, setCreatedLink] = useState<any>(null);

  // Create link mutation
  const mutation = useMutation({
    mutationFn: createLink,
    onSuccess: (data) => {
      message.success('Link created successfully!');
      setCreatedLink(data);
      form.resetFields();
    },
    onError: () => {
      message.error('Failed to create link');
    },
  });

  // Form submission handler
  const onFinish = (values: any) => {
    mutation.mutate(values);
  };

  return (
    <Card>
      <Title level={3}>Create New Link</Title>
      
      <Form
        form={form}
        name="createLink"
        layout="vertical"
        onFinish={onFinish}
        style={{ maxWidth: 600, margin: '0 auto' }}
      >
        <Form.Item
          label="White URL (Main Traffic)"
          name="white_url"
          rules={[
            { required: true, message: 'Please enter the white URL' },
            { type: 'url', message: 'Please enter a valid URL' }
          ]}
        >
          <Input placeholder="https://example.com" />
        </Form.Item>

        <Form.Item
          label="Black URL (Bot Traffic)"
          name="black_url"
          rules={[
            { required: true, message: 'Please enter the black URL' },
            { type: 'url', message: 'Please enter a valid URL' }
          ]}
        >
          <Input placeholder="https://bot-example.com" />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={mutation.isPending}
            block
          >
            Create Link
          </Button>
        </Form.Item>
      </Form>

      {createdLink && (
        <Result
          status="success"
          title="Link Created Successfully!"
          subTitle={`Your new tracking code is: ${createdLink.code}`}
          extra={[
            <div key="link-details" style={{ textAlign: 'left', maxWidth: 600, margin: '0 auto' }}>
              <Typography.Paragraph>
                <strong>Code:</strong> {createdLink.code}
              </Typography.Paragraph>
              <Typography.Paragraph>
                <strong>White URL:</strong> {createdLink.white_url}
              </Typography.Paragraph>
              <Typography.Paragraph>
                <strong>Black URL:</strong> {createdLink.black_url}
              </Typography.Paragraph>
            </div>,
            <Button 
              key="create-another" 
              type="primary" 
              onClick={() => setCreatedLink(null)}
            >
              Create Another Link
            </Button>
          ]}
        />
      )}
    </Card>
  );
};

export default LinkForm;
