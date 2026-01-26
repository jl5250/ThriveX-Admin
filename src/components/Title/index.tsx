import { ReactNode } from 'react'

interface Props {
    value: string,
    children?: ReactNode,
    className?: string
}

export default ({ value, children }: Props) => {
    return (
        <div className="px-6 py-3 bg-white rounded-xl shadow-sm border border-gray-100 mb-2">
            <div className="overflow-auto flex justify-between items-center">
                <h2 className="font-semibold text-black dark:text-white text-xl min-w-24">{value}</h2>

                {children}
            </div>
        </div>
    )
}