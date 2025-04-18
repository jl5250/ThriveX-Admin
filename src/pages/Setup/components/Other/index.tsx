import { useState } from "react";
import { Segmented } from "antd";
import { HiOutlineMail } from "react-icons/hi";
import Email from './components/Email'

type Tab = "email" | "statis" | "storage" | string

export default () => {
    const [tab, setTab] = useState<Tab>("email")

    const tabList = [
        {
            label: "邮箱配置",
            value: "email",
            icon: <HiOutlineMail />,
            className: "[&>div]:flex [&>div]:items-center [&>div]:!px-4"
        },
        {
            label: "统计配置",
            value: "statis",
            icon: <HiOutlineMail />,
            className: "[&>div]:flex [&>div]:items-center [&>div]:!px-4"
        },
        {
            label: "存储配置",
            value: "storage",
            icon: <HiOutlineMail />,
            className: "[&>div]:flex [&>div]:items-center [&>div]:!px-4"
        }
    ]

    return (
        <div>
            <Segmented<string>
                size="large"
                options={tabList}
                onChange={setTab}
                className="ml-10"
            />

            {tab === "email" && <Email />}
        </div>
    )
}