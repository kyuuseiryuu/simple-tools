import { Button, Form, Input, Select, Space, Tag, Typography, message } from 'antd';
import { useCallback, useMemo } from 'react';
import { z } from 'zod';


const shape = {
  appName: z.string().min(1),
  domain: z.array(z.string().min(1)).min(1),
};

const FormDataSchema = z.object(shape);

type FormData = z.infer<typeof FormDataSchema>

const useTraeficConfig = (config: FormData) => {
  const configEntry = useMemo(() => {
    if (FormDataSchema.safeParse(config).error) return [];
    const template = `traefik.enable:true
traefik.http.routers.${config.appName}.entrypoints:websecure
traefik.http.routers.${config.appName}.rule:${config.domain.map(s => `Host(\`${s}\`)`).join(' || ')}
traefik.http.routers.${config.appName}.tls.certresolver:myresolver
traefik.http.services.${config.appName}.loadbalancer.server.port:80`;
    return template.split('\n').map(s => s.split(':'));
  }, [config]);
  return [configEntry];
}

const TraefickConf = () => {
  const [form] = Form.useForm<FormData>();
  const watch = Form.useWatch([], form);
  const [configEntry] = useTraeficConfig(watch);
  const labels = useMemo(() => configEntry.map(e => e.join(': ')).join('\n'), [configEntry]);

  const copy = useCallback(async (text?: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text).catch((e) => {
      message.error(e.message)
    });
    message.success('Copied!');
  }, []);

  return (
    <>
      <Typography.Title level={1}>Traefick docker labels</Typography.Title>
      <Form form={form} layout="vertical">
        <Form.Item name="appName" label="App">
          <Input size="large" allowClear />
        </Form.Item>
        <Form.Item name="domain" label="Domain">
          <Select size="large" mode="tags" allowClear />
        </Form.Item>
      </Form>
      <section>
        <Button block size='large' disabled={!labels} type="primary" onClick={() => copy(labels)}>Copy All Labels</Button>
        <div style={{ marginTop: 20 }}>
          <Space direction="vertical">
            {configEntry.map((e, i) => (
              <div key={i}>
                <Space>
                  {e.map((s, j) => (
                    <Tag key={j} style={{ cursor: 'pointer' }} onClick={() => copy(s)} color="blue">{s}</Tag>
                  ))}
                </Space>
              </div>
            ))}
          </Space>
        </div>
      </section>
    </>
  );
}

export default TraefickConf;
