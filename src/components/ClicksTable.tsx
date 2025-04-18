
import { useState, useEffect } from 'react';
import { Table, Card, Select, Switch, Typography, Space, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getClicks, Click, FilterParams } from '../api';

const { Title } = Typography;
const { Option } = Select;

const ClicksTable: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<FilterParams>({});
  const [countryOptions, setCountryOptions] = useState<string[]>([]);

  // Fetch clicks with pagination and filters
  const { data, isLoading, error } = useQuery({
    queryKey: ['clicks', page, pageSize, filters],
    queryFn: () => getClicks({ page, pageSize, ...filters }),
  });

  // Update country options from API response
  useEffect(() => {
    if (data?.filters?.countries) {
      setCountryOptions(data.filters.countries);
    }
  }, [data]);

  // Handle filter changes
  const handleCountryChange = (value: string | undefined) => {
    setFilters({ ...filters, country: value });
    setPage(1); // Reset to first page on filter change
  };

  const handleBotFilterChange = (checked: boolean | undefined) => {
    if (checked === undefined) {
      const { is_bot, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters({ ...filters, is_bot: checked });
    }
    setPage(1); // Reset to first page on filter change
  };

  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 150,
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      width: 120,
      render: (country: string) => (
        <Tag color="blue">{country || 'Unknown'}</Tag>
      ),
    },
    {
      title: 'Bot',
      dataIndex: 'is_bot',
      key: 'is_bot',
      width: 80,
      render: (isBot: boolean) => (
        <Tag color={isBot ? 'volcano' : 'green'}>
          {isBot ? 'Yes' : 'No'}
        </Tag>
      ),
    },
    {
      title: 'Link ID',
      dataIndex: 'link_id',
      key: 'link_id',
      width: 100,
    },
    {
      title: 'User Agent',
      dataIndex: 'user_agent',
      key: 'user_agent',
      ellipsis: true,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  if (error) {
    return <div>Error loading clicks data</div>;
  }

  return (
    <Card>
      <Title level={3}>Clicks Analytics</Title>
      
      <Space style={{ marginBottom: 16 }}>
        <span>Filter by Country:</span>
        <Select
          allowClear
          style={{ width: 200 }}
          placeholder="Select country"
          onChange={handleCountryChange}
          value={filters.country}
        >
          {countryOptions.map(country => (
            <Option key={country} value={country}>{country || 'Unknown'}</Option>
          ))}
        </Select>
        
        <span>Bot Traffic:</span>
        <Select
          allowClear
          style={{ width: 120 }}
          placeholder="Bot Status"
          onChange={(value) => handleBotFilterChange(value !== undefined ? value : undefined)}
          value={filters.is_bot}
        >
          <Option value={true}>Bots Only</Option>
          <Option value={false}>Real Users</Option>
        </Select>
      </Space>

      <Table
        rowKey="id"
        dataSource={data?.data || []}
        columns={columns}
        loading={isLoading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: data?.pagination?.total || 0,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize);
          },
        }}
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
};

export default ClicksTable;
