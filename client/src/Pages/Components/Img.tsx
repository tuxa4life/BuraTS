import React from 'react'

type ImgProps = React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string
    fallback?: string
}

const Img: React.FC<ImgProps> = ({ src, fallback = '/default.jpg', ...rest }) => {
    const [current, setCurrent] = React.useState(src)

    const handleError = () => {
        if (current !== fallback) setCurrent(fallback)
    }

    React.useEffect(() => {
        setCurrent(src)
    }, [src])

    return <img src={current} onError={handleError} {...rest} />
}

export default Img
