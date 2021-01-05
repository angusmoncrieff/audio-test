const LogOutput = ({ log }) => {

    return (
        <div id='log-box'>
            {log.map((msg, i) => (
                <div key={i}>
                    {msg}
                </div>
            ))}
        </div>
    )
}

export default LogOutput;